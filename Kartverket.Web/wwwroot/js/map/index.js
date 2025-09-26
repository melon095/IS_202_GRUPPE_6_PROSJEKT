const ACTIVE_BUTTON_TYPE = {
    PAN: 'PAN',
    ADD: 'ADD',
}

const GEOLOCATION_MODE = {
    AUTO_MOVE: 'AUTO_MOVE',
    MANUAL: 'MANUAL'
};

const TILE_LAYER_URL = 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png';
const TILE_LAYER_COPYRIGHT = `&copy; <a href="http://www.kartverket.no/">Kartverket</a>`;
const COORD_PRECISION = ".000001";
const COORD_PRECISION_INT = 6;

const clean = (str) => {
    return str.replace(/[\n\r]/g, ' ').trim();
}

class LeafletMap {
    #geoJson = [];
    #underlyingDiv = null;
    #mapInst = null;

    /** Layer for when adding points */
    #inputLayer = null;
    /** Layer for server data */
    #markerLayer = null;
    #data = [];
    
    #formPanel = null;
    #buttonControl = null;
    
    #activeButtonType = ACTIVE_BUTTON_TYPE.PAN;
    
    constructor(div, parentDiv) {
        this.#underlyingDiv = div;
        this.#mapInst = L.map(div, {
            center: [58.14654566028351, 7.991145057860376],
            zoom: 15
        });
        
        L.tileLayer(TILE_LAYER_URL, {
            maxZoom: 19,
            attribution: TILE_LAYER_COPYRIGHT
        }).addTo(this.#mapInst);
        
        this.#inputLayer = L.layerGroup().addTo(this.#mapInst);
        this.#markerLayer = L.layerGroup().addTo(this.#mapInst);
        this.#formPanel = new Panel(parentDiv, 'rightAddPanel');

        this.map.on('click', this.onMapClick.bind(this));
        
        this.#addControlLayer();
    }
    
    get map() {
        return this.#mapInst;
    }
    
    get buttonControl() {
        return this.#buttonControl;
    }

    addGeoJson(geo) {
        console.log(geo);
        L
            .geoJSON(geo, {
                style: function (feature) {
                    if (feature.geometry.type === 'LineString') {
                        return { color: 'red', weight: 10 };
                    }
                    return { color: 'blue' };
                }
            })
            .bindPopup(function (layer) {
                return layer.feature.properties.description || 'No description';
            })
            .addTo(this.#markerLayer);

        this.#mapInst.invalidateSize();
    }
    
    displayInputPoints() {
        if (this.#data == null || this.#data.length === 0)
        {
            return;
        }

        this.#inputLayer.clearLayers();
        this.#data.forEach(point => {
            L.marker([point.lat, point.lng]).addTo(this.#inputLayer);
        });
    }
    
    clearInputPoints() {
        this.#data = [];
        this.#inputLayer.clearLayers();
    }
    
    async onMapClick(e) {
        if (this.#activeButtonType !== ACTIVE_BUTTON_TYPE.ADD)
        {
            return;
        }
        
        const cord = e.latlng;
        const point = {
            lat: cord.lat.toFixed(COORD_PRECISION_INT),
            lng: cord.lng.toFixed(COORD_PRECISION_INT)
        };
        
        if (this.#data == null)
        {
            this.#data = [];
        }
        
        this.#data.push(point);
        this.displayInputPoints();
    }
    
    async submitData(autoSubmit = false) {
        if (this.#data == null || this.#data.length < 1)
        {
            return;
        }

        this.#formPanel.reset();

        this.#formPanel.setTitle("Last opp din rapport");

        const fields = [
            {
                name: "title",
                label: "Tittel",
                type: "text",
                required: true,
                placeholder: "Skriv inn tittel"
            },
            {
                name: "description",
                label: "Beskrivelse",
                type: "textarea",
                placeholder: "Skriv inn beskrivelse"
            },
            {
                name: "category",
                label: "Kategori",
                type: "select",
                options: [] // TODO: Kategori
            },
            {
                name: "points",
                label: "Punkter",
                type: "table",
                columns: [
                    { key: "lat", label: "Latitude", type: "number", step: COORD_PRECISION },
                    { key: "lng", label: "Longitude", type: "number", step: COORD_PRECISION },
                    { key: "elevation", label: "Høyde (fot)", type: "number", value: 0 }
                ],
                value: this.#data
            },
        ];

        this.#formPanel.createForm(
            fields,
            async (formData) => {
                const submissionData = {
                    ...formData,
                    points: this.#data
                };
                
                await this.#theSubmitFunction(submissionData);
                
                this.clearInputPoints();
            },
            () => {
                this.clearInputPoints();
                this.#formPanel.reset();
            },
            autoSubmit
        );

        this.#formPanel.show();
    }
    
    async quickSubmitData() {
        // TODO: ADD GPS LOCATION AS POINT!
        
        await this.submitData(true);
    }
    
    async #theSubmitFunction(formData) {
        try {
            const req = {
                reportTitle: clean(formData.title) || "Midlertidlig tittel",
                reportDescription: clean(formData.description) || "Midlertidlig beskrivelse",
                points: this.#data,
            }

            const response = await fetch("/Map/Upload", {
                method: "POST",
                body: JSON.stringify(req),
                headers: {"Content-Type": "application/json"}
            });

            if (response.ok) {
                let result = await response.json();
                this.addGeoJson(result);
            } else {
                let result = await response.json();
                for (const key in result) {
                    this.#formPanel.setErrorOnField(key, result[key]);
                }
            }
        } catch (error) {
            console.error("Det skjedde en feil ved innsending av rapport:", error);
            alert("Det skjedde en feil ved innsending av rapport. " + error.message);
            return;
        }
    }
    
    cancelChanges() {
        this.clearInputPoints();
        this.#formPanel.reset();
    }

    addButtonToControl(createCallback) {
        if (this.#buttonControl && this.#buttonControl.container) {
            const button = L.DomUtil.create('button', '', this.#buttonControl.container);
            
            createCallback(button);
        }
    }

    enablePanMode() {
        this.map.dragging.enable();
        this.map.doubleClickZoom.enable();
        this.map.scrollWheelZoom.enable();
    }
    
    disablePanMode() {
        this.map.dragging.disable();
        this.map.doubleClickZoom.disable();
        this.map.scrollWheelZoom.disable();
    }
    
    enableLineMode() {
        this.enablePanMode();
        this.#activeButtonType = ACTIVE_BUTTON_TYPE.ADD;
    }
    
    disableLineMode() {
        this.enablePanMode();
    }

    #addControlLayer() {
        const control = L.Control.extend({
            options: {
                position: 'topright'
            },
            onAdd: function (map) {
                this.container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
                this.container.style.backgroundColor = 'white';
                this.container.style.padding = '5px';

                L.DomEvent.disableClickPropagation(this.container);
                this.container.style.display = 'flex';
                this.container.style.flexDirection = 'column';
                this.container.style.gap = '5px';

                return this.container;
            }
        });

        this.#buttonControl = new control;
        this.#mapInst.addControl(this.#buttonControl);
    }
}

class Panel {
    /** @type {HTMLElement} */
    #panel = null;
    /** @type {HTMLElement} */
    #content;
    /** @type {HTMLElement} */
    #header;
    /** @type {HTMLElement} */
    #closeBtn;
    #parentDiv;
    #isOpen = false;

    constructor(parentDiv, modelId) {
        this.#parentDiv = parentDiv;
        this.#panel = document.getElementById(modelId) ?? document.createElement('div');
        this.#header = document.createElement('div');
        this.#content = document.createElement('div');
        this.#closeBtn = document.createElement('button');

        this.#setupPanel(modelId);
    }

    #setupPanel(modelId) {
        this.#panel.classList.add('panel-right');
        this.#panel.id = modelId;

        this.#header.classList.add('panel-right-header');
        this.#content.classList.add('panel-right-content');

        this.#closeBtn.classList.add('panel-close-btn');
        this.#closeBtn.innerHTML = '×';
        this.#closeBtn.onclick = () => this.hide();

        const title = document.createElement('h3');
        title.textContent = 'Add Point Data';
        title.style.margin = '0';

        this.#header.appendChild(title);
        this.#header.appendChild(this.#closeBtn);
    }

    insert() {
        if (this.#panel.parentElement) return;

        this.#parentDiv.appendChild(this.#panel);

        this.#panel.appendChild(this.#header);
        this.#panel.appendChild(this.#content);
    }

    show() {
        this.insert();
        this.#panel.classList.add('open');
        this.#isOpen = true;
    }

    hide() {
        this.#panel.classList.remove('open');
        this.#isOpen = false;
    }

    toggle() {
        if (this.#isOpen) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    reset() {
        this.setTitle('');
        this.setContent('');
    }

    get isOpen() {
        return this.#isOpen;
    }

    setContent(html) {
        this.#content.innerHTML = html;
    }

    setTitle(title) {
        const titleElement = this.#header.querySelector('h3');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    createForm(fields, onSubmit, onCancel, autoSubmit) {
        const form = document.createElement('form');
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            onSubmit(data);
            this.hide();
        };

        fields.forEach(field => {
            const group = document.createElement('div');
            group.classList.add('panel-form-group');

            const label = document.createElement('label');
            label.textContent = field.label;
            label.setAttribute('for', field.name);
            group.appendChild(label);

            let input;
            switch(field.type) {
                case "textarea": {
                    input = document.createElement('textarea');
                    break;
                }
                
                case "select": {
                    input = document.createElement('select');
                    field.options?.forEach(option => {
                        const opt = document.createElement('option');
                        opt.value = option.value;
                        opt.textContent = option.label;
                        input.appendChild(opt);
                    });
                    break;
                }
                
                case "table": {
                    const table = document.createElement('table');
                    table.classList.add('panel-table');

                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    field.columns.forEach(col => {
                        const th = document.createElement('th');
                        th.textContent = col.label;
                        headerRow.appendChild(th);
                    });
                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    const tbody = document.createElement('tbody');
                    if (field.value && Array.isArray(field.value)) {
                        field.value.forEach((rowData, index) => {
                            const tr = document.createElement('tr');
                            field.columns.forEach(col => {
                                const td = document.createElement('td');
                                const cellInput = document.createElement('input');
                                cellInput.type = col.type || 'text';
                                cellInput.name = `${field.name}[${index}][${col.key}]`;
                                cellInput.value = rowData[col.key] || '';
                                if (col.step) cellInput.step = col.step;
                                td.appendChild(cellInput);
                                tr.appendChild(td);
                            });
                            tbody.appendChild(tr);
                        });
                    }
                    table.appendChild(tbody);

                    input = table;
                    break;
                }
                
                default: {
                    input = document.createElement('input');
                    input.type = field.type || 'text';
                    if (field.step) input.step = field.step;
                    break;
                }
            }

            input.name = field.name;
            input.id = field.name;
            if (field.required) input.required = true;
            if (field.placeholder) input.placeholder = field.placeholder;
            if (field.value) input.value = field.value;

            group.appendChild(input);
            form.appendChild(group);
        });

        const buttonGroup = document.createElement('div');
        buttonGroup.style.marginTop = '1.5rem';

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.classList.add('panel-btn');
        submitBtn.textContent = 'Save';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.classList.add('panel-btn', 'panel-btn-secondary');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => {
            if (onCancel) onCancel();
            this.hide();
        };

        buttonGroup.appendChild(submitBtn);
        buttonGroup.appendChild(cancelBtn);
        form.appendChild(buttonGroup);

        this.setContent('');
        this.#content.appendChild(form);
        
        if (autoSubmit) {
            onSubmit(Object.fromEntries(new FormData(form).entries()));
            this.hide();
        }
        
        return form;
    }
    
    setErrorOnField(fieldName, message) {
        const field = this.#content.querySelector(`[name="${fieldName}"]`);
        if (field) {
            let errorElem = field.parentElement.querySelector('.panel-error');
            if (!errorElem) {
                errorElem = document.createElement('div');
                errorElem.classList.add('panel-error');
                field.parentElement.appendChild(errorElem);
            }
            errorElem.textContent = message;
        }
    }
}

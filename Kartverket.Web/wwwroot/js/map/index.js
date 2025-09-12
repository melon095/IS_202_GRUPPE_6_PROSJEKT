const ACTIVE_BUTTON_TYPE = {
    PAN: 'PAN',
    ADD: 'ADD',
    LINE: 'LINE'
}

const GEOLOCATION_MODE = {
    AUTO_MOVE: 'AUTO_MOVE',
    MANUAL: 'MANUAL'
};

const TILE_LAYER_URL = 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png';
const TILE_LAYER_COPYRIGHT = `&copy; <a href="http://www.kartverket.no/">Kartverket</a>`;

class CMap {
    #geojson = [];
    #div = null;
    #map = null;
    #currentPositionMarker = null;
    #accuracyCircle = null;
    #currentReport = null;
    
    lineState = null;
    buttonControl = null;
    activeButtonType = ACTIVE_BUTTON_TYPE.PAN;

    get map() {
        return this.#map;
    }
    
    onLoad(geojson, div) {
        this.#geojson = geojson;
        this.#div = div;
        this.#map = L.map(this.#div, {
            center: [58.14654566028351, 7.991145057860376],
            zoom: 15
        })

        L.tileLayer(TILE_LAYER_URL, {
            maxZoom: 19,
            attribution: TILE_LAYER_COPYRIGHT
        }).addTo(this.#map);

        this.#addGeoJson(this.#geojson);
        this.#addControlLayer();
        this.#geolocationTimer();
        this.addControlButton(this.buttonControl.container);

        // const HUNDRED_MS = 100;
        // setInterval(() => {
        //     switch(this.activeButtonType)
        //     {
        //         case ACTIVE_BUTTON_TYPE.PAN:
        //             this.setDragging(true);
        //             break;
        //
        //         case ACTIVE_BUTTON_TYPE.ADD:
        //         case ACTIVE_BUTTON_TYPE.LINE:
        //             this.setDragging(false);
        //             break;
        //
        //         default:
        //             console.error("Unknown activeButtonType: " + this.activeButtonType);
        //             break;
        //     }
        // }, HUNDRED_MS);

        this.map.on('click', async (e) => {
            if (!this.currentReport) this.currentReport = await this.#prepareReport();
            
            if(this.activeButtonType === ACTIVE_BUTTON_TYPE.ADD)
            {
                const coord = e.latlng;
                const point = {
                    Latitude: coord.lat,
                    Longitude: coord.lng,
                };

                await this.addPoint(point);
            }

            if(this.activeButtonType === ACTIVE_BUTTON_TYPE.LINE)
            {
                if (this.lineState == null)
                {
                    this.lineState = [];
                }

                this.lineState.push(e.latlng);
                let prevItem = null, newItem = null;
                if (this.lineState.length >= 2)
                {
                    prevItem = this.lineState[this.lineState.length - 2];
                    newItem = this.lineState[this.lineState.length - 1];
                }
                else
                {
                    prevItem = this.lineState[this.lineState.length - 1];
                    newItem = this.lineState[this.lineState.length - 1];
                }

                L.polyline([
                        [prevItem.lat, prevItem.lng],
                        [newItem.lat, newItem.lng]
                    ],
                    {
                        color: 'red'
                    }
                ).addTo(this.#map);
            }

            // if (this.geolocationMode === GEOLOCATION_MODE.AUTO_MOVE)
            // {
            //     this.geolocationMode = GEOLOCATION_MODE.MANUAL;
            //     geolocationModeButton.innerHTML = 'Manual Position';
            // }
        });

        this.map.on("dblclick", async (e) => {
            if (this.lineState === null ||
                this.lineState.length <= 1)
            {
                return;
            }

            const coords = this.lineState
                .map(({lat,lng}) => ({latitude: lat, longitude: lng}));

            await this.addLines(coords);

            this.lineState = null;
        });
    }
    
    async addPoint(point) {
        const req = {
            latitude: point.Latitude,
            longitude: point.Longitude,
            reportId: this.currentReport.id
        }
        
        const response = await fetch("/Map/AddPoint", {
            method: "POST",
            body: JSON.stringify(req),
            headers: {"Content-Type": "application/json"}
        });

        if (response.ok) {
            const newPoint = await response.json();
            this.#addGeoJson(newPoint);
        }
    }

    async addLines(coords) {
        const req = {
            points: coords,
            reportId: this.currentReport.id
        }

        const response = await fetch("/Map/AddLines", {
            method: "POST",
            body: JSON.stringify(req),
            headers: {"Content-Type": "application/json"}
        });

        if (response.ok) {
            const newLine = await response.json();
            this.#addGeoJson(newLine);
        }
    }

    addControlButton(container) {
        const panButton = L.DomUtil.create('button', '', container);
        panButton.innerHTML = 'Pan';
        panButton.style.display = 'block';
        panButton.style.marginBottom = '5px';

        panButton.onclick = () => {
            this.activeButtonType = ACTIVE_BUTTON_TYPE.PAN;
        };

        const addButton = L.DomUtil.create('button', '', container);
        addButton.innerHTML = 'Add point';
        addButton.style.display = 'block';

        addButton.onclick = () => {
            this.activeButtonType = ACTIVE_BUTTON_TYPE.ADD;
        };

        const lineButton = L.DomUtil.create('button', '', container);
        lineButton.innerHTML = 'Add line';
        lineButton.style.display = 'block';

        lineButton.onclick = () => {
            this.activeButtonType = ACTIVE_BUTTON_TYPE.LINE;
        };
    }
    
    #geolocationTimer() {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        const updatePosition = (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            if (this.#currentPositionMarker) {
                this.#map.removeLayer(this.#currentPositionMarker);
            }

            if (this.#accuracyCircle) {
                this.#map.removeLayer(this.#accuracyCircle);
            }

            this.#currentPositionMarker = L.marker([lat, lon]).addTo(this.#map);
            this.#accuracyCircle = L.circle([lat, lon], {radius: accuracy}).addTo(this.#map);

            console.log({lat, lon, accuracy});

            if (this.geolocationMode === GEOLOCATION_MODE.MANUAL) {
                return;
            }

            // this.#map.setView([lat, lon], 15);
        };

        const handleError = (error) => {
            console.error("Error obtaining geolocation: ", error);
        };

        const opts = {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        };
        navigator.geolocation.getCurrentPosition(updatePosition, handleError, opts);
        navigator.geolocation.watchPosition(updatePosition, handleError, opts);
    }

    #addGeoJson(geo) {
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
            .addTo(this.#map);

        this.#map.invalidateSize();
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
                // const geolocationModeButton = L.DomUtil.create('button', '', container);
                // geolocationModeButton.innerHTML = 'Follow Position';
                // geolocationModeButton.style.display = 'block';
                // geolocationModeButton.style.marginTop = '5px';
                //
                // geolocationModeButton.onclick = () => {
                //     if (this.geolocationMode === GEOLOCATION_MODE.AUTO_MOVE) {
                //         this.geolocationMode = GEOLOCATION_MODE.MANUAL;
                //         geolocationModeButton.innerHTML = 'Manual Position';
                //     } 
                //     else if (this.geolocationMode === GEOLOCATION_MODE.MANUAL) {
                //         this.geolocationMode = GEOLOCATION_MODE.AUTO_MOVE;
                //         geolocationModeButton.innerHTML = 'Follow Position';
                //     }
                // };

                L.DomEvent.disableClickPropagation(this.container);

                return this.container;
            }
        });

        this.buttonControl = new control;
        this.#map.addControl(this.buttonControl);
    }
    
    async #prepareReport() {
        const reportId = await fetch("/Map/CreateReport", { method: "POST"});
        if (reportId.ok) {
            const json = await reportId.json();
            return json;
        }
        
        return null;
    }
}

class PilotMap extends CMap {
    #addPanel = new Panel('mapParent', 'rightAddPanel');
    #pendingPointData = null;
    #pendingLineData = null;

    onLoad(geojson, div) {
        super.onLoad(geojson, div);
        this.#addPanel.insert();
    }

    async addPoint(point) {
        this.#addPanel.reset();
        this.#pendingPointData = point;
        this.#showPointDataForm();
    }
    
    async addLines(coords) {
        this.#addPanel.reset();
        this.#pendingLineData = coords;
        this.#showLineDataForm();
    }
    
    #showPointDataForm() {
        this.#addPanel.setTitle('Add Point Information');

        const fields = [
            {
                name: 'description',
                label: 'Description',
                type: 'textarea',
                placeholder: 'Enter description'
            },
            {
                name: 'category',
                label: 'Category',
                type: 'select',
                options: [
                    { value: 'landmark', label: 'Landmark' },
                    { value: 'facility', label: 'Facility' },
                    { value: 'hazard', label: 'Hazard' },
                    { value: 'other', label: 'Other' }
                ]
            },
            {
                name: 'latitude',
                label: 'Latitude',
                type: 'number',
                value: this.#pendingPointData.Latitude.toFixed(6),
                step: '0.000001'
            },
            {
                name: 'longitude',
                label: 'Longitude',
                type: 'number',
                value: this.#pendingPointData.Longitude.toFixed(6),
                step: '0.000001'
            },
            {
                name: 'Meters above sea level in foot',
                label: 'Meters above sea level in foot',
                type: 'number',
                value: '',
                step: '0.1'
            }
        ];

        this.#addPanel.createForm(
            fields,
            (data) => this.#submitPointData(data),
            () => this.#cancelPointAdd()
        );

        this.#addPanel.show();
    }

    async #submitPointData(formData) {
        if (!this.#pendingPointData) return;

        const pointData = {
            ...this.#pendingPointData,
            Latitude: parseFloat(formData.latitude),
            Longitude: parseFloat(formData.longitude),
            name: formData.name,
            description: formData.description,
            category: formData.category
        };

        try {
            await super.addPoint(pointData);
            this.#addPanel.hide();
            this.#pendingPointData = null;
        } catch (error) {
            console.error('Failed to add point:', error);
            alert('Failed to add point. Please try again.');
        }
    }

    #cancelPointAdd() {
        this.#pendingPointData = null;
        this.#addPanel.reset();
    }
    
    #showLineDataForm() {
        this.#addPanel.reset();
        
        this.#addPanel.setTitle("Legg til mange punkter");
        
        const fields = [
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
                name: "lines",
                label: "Linje punkter",
                type: "table",
                columns: [
                    { key: "latitude", label: "Latitude", type: "number", step: "0.000001" },
                    { key: "longitude", label: "Longitude", type: "number", step: "0.000001" }
                ],
                value: this.#pendingLineData
            }
        ];
        
        this.#addPanel.createForm(
            fields,
            (data) => this.#submitLineData(data),
            () => this.#cancelLineAdd()
        );
        
        this.#addPanel.show();
    }
    
    async #submitLineData(formData) {
        if (!this.#pendingLineData) return;
        
        const coords = this.#pendingLineData.map((point, index) => ({
            latitude: parseFloat(formData.lines[index].latitude),
            longitude: parseFloat(formData.lines[index].longitude)
        }));
        
        try {
            await super.addLines(coords);
            this.#addPanel.hide();
            this.#pendingLineData = null;
        } catch (error) {
            console.error('Failed to add lines:', error);
            alert('Failed to add lines. Please try again.');
        }
    }
    
    #cancelLineAdd() {
        this.#pendingLineData = null;
        this.#addPanel.reset();
    }
}

class UserMap extends CMap {
    onLoad() {
        super.onLoad();
    }
}

class KartverketMap extends CMap {
    onLoad() {
        super.onLoad();
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
    #parentId;
    #isOpen = false;

    constructor(parentId, modelId) {
        this.#parentId = parentId;
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

        const parent = document.getElementById(this.#parentId);
        parent.appendChild(this.#panel);

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

    createForm(fields, onSubmit, onCancel) {
        const form = document.createElement('form');
        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            onSubmit(data);
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
    }
}

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

// 1. The control button shows a "add" icon and a "pan" icon.
// 2. When the add button is clicked, and a point has been added, a submit button is shown. 
// 3. When the submit button is clicked, a form is shown with fields for everything.
// 4. If submitted
//       a. The point(s) is added to the map
//       b. A report is made on the server and the point(s) is linked to the report
//       c. The form is closed
// 5. If cancelled
//       a. The point(s) is removed from the map
//       b. The form is closed

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

    addGeoJson(geo) {
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
            .addTo(this.#mapInst);
        
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
    
    async submitData() {
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
            async (data) => {
                try {
                    const reportBody = {
                        title: clean(data.title || "Uten tittel"),
                        description: clean(data.description || ""),
                    };
                    const report = await fetch("/Report/Create", { 
                        method: "POST",
                        body: JSON.stringify(reportBody),
                        headers: { "Content-Type": "application/json" }
                    })
                        .then(res => res.json());
                    
                    const req = {
                        reportId: report.id,
                        points: this.#data,
                    }

                    const response = await fetch("/Map/Upload", {
                        method: "POST",
                        body: JSON.stringify(req),
                        headers: {"Content-Type": "application/json"}
                    });

                    if (response.ok) {
                        const newLine = await response.json();
                        this.addGeoJson(newLine);
                    }
                } catch (error) {
                    console.error("Det skjedde en feil ved innsending av rapport:", error);
                    alert("Det skjedde en feil ved innsending av rapport. " + error.message);
                    return;
                }
                
                this.#formPanel.reset();
                this.clearInputPoints();
            },
            () => {
                this.clearInputPoints();
                this.#formPanel.reset();
            }
        );

        this.#formPanel.show();
    }

    addButtonToControl(createCallback) {
        if (this.#buttonControl && this.#buttonControl.container) {
            const button = L.DomUtil.create('button', '', this.#buttonControl.container);
            button.style.display = 'block';
            
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

// class CMap {
//     #geojson = [];
//     #div = null;
//     #map = null;
//     #currentPositionMarker = null;
//     #accuracyCircle = null;
//     #currentReport = null;
//    
//     lineState = null;
//     buttonControl = null;
//     activeButtonType = ACTIVE_BUTTON_TYPE.PAN;
//
//     get map() {
//         return this.#map;
//     }
//    
//     onLoad(geojson, div) {
//         this.#geojson = geojson;
//         this.#div = div;
//         this.#map = L.map(this.#div, {
//             center: [58.14654566028351, 7.991145057860376],
//             zoom: 15
//         })
//
//         L.tileLayer(TILE_LAYER_URL, {
//             maxZoom: 19,
//             attribution: TILE_LAYER_COPYRIGHT
//         }).addTo(this.#map);
//
//         this.#addGeoJson(this.#geojson);
//         this.#addControlLayer();
//         this.#geolocationTimer();
//         this.addControlButton(this.buttonControl.container);
//
//         // const HUNDRED_MS = 100;
//         // setInterval(() => {
//         //     switch(this.activeButtonType)
//         //     {
//         //         case ACTIVE_BUTTON_TYPE.PAN:
//         //             this.setDragging(true);
//         //             break;
//         //
//         //         case ACTIVE_BUTTON_TYPE.ADD:
//         //         case ACTIVE_BUTTON_TYPE.LINE:
//         //             this.setDragging(false);
//         //             break;
//         //
//         //         default:
//         //             console.error("Unknown activeButtonType: " + this.activeButtonType);
//         //             break;
//         //     }
//         // }, HUNDRED_MS);
//
//         this.map.on('click', async (e) => {
//            
//             // if (this.geolocationMode === GEOLOCATION_MODE.AUTO_MOVE)
//             // {
//             //     this.geolocationMode = GEOLOCATION_MODE.MANUAL;
//             //     geolocationModeButton.innerHTML = 'Manual Position';
//             // }
//         });
//
//         this.map.on("dblclick", async (e) => {
//             if (this.lineState === null ||
//                 this.lineState.length <= 1)
//             {
//                 return;
//             }
//
//             const coords = this.lineState
//                 .map(({lat,lng}) => ({
//                     latitude: lat.toFixed(COORD_PRECISION_INT), 
//                     longitude: lng.toFixed(COORD_PRECISION_INT)
//                 }));
//
//             await this.addLines(coords);
//
//             this.lineState = null;
//         });
//     }
//    
//     async addPoint(point) {
//         const req = {
//             latitude: point.Latitude,
//             longitude: point.Longitude,
//             reportId: this.currentReport.id
//         }
//        
//         const response = await fetch("/Map/AddPoint", {
//             method: "POST",
//             body: JSON.stringify(req),
//             headers: {"Content-Type": "application/json"}
//         });
//
//         if (response.ok) {
//             const newPoint = await response.json();
//             this.#addGeoJson(newPoint);
//         }
//     }
//
//     async addLines(coords) {
//
//     }
//
//     addControlButton(container) {
//         const panButton = L.DomUtil.create('button', '', container);
//         panButton.style.display = 'block';
//        
//         const panImg = document.createElement('img');
//         panImg.src = '/svg/geo-pan-fill.svg';
//         panImg.style.verticalAlign = 'middle';
//         panImg.style.width = '24px';
//        
//         panButton.appendChild(panImg);
//        
//         panButton.onclick = () => {
//             this.activeButtonType = ACTIVE_BUTTON_TYPE.PAN;
//         };
//
//         const addButton = L.DomUtil.create('button', '', container);
//         addButton.style.display = 'block';
//         const addImg = document.createElement('img');
//         addImg.src = '/svg/geo-plus-fill.svg';
//         addImg.style.verticalAlign = 'middle';
//        
//         addButton.appendChild(addImg);
//        
//         addButton.onclick = () => {
//             this.activeButtonType = ACTIVE_BUTTON_TYPE.ADD;
//         };
//
//         const lineButton = L.DomUtil.create('button', '', container);
//         lineButton.style.display = 'block';
//        
//         const lineImg = document.createElement('img');
//         lineImg.src = '/svg/geo-line-fill.svg';
//         lineImg.style.verticalAlign = 'middle';
//        
//         lineButton.appendChild(lineImg);
//        
//         lineButton.onclick = () => {
//             this.activeButtonType = ACTIVE_BUTTON_TYPE.LINE;
//         };
//     }
//    
//     #geolocationTimer() {
//         if (!navigator.geolocation) {
//             console.error("Geolocation is not supported by this browser.");
//             return;
//         }
//
//         const updatePosition = (position) => {
//             const lat = position.coords.latitude;
//             const lon = position.coords.longitude;
//             const accuracy = position.coords.accuracy;
//
//             if (this.#currentPositionMarker) {
//                 this.#map.removeLayer(this.#currentPositionMarker);
//             }
//
//             if (this.#accuracyCircle) {
//                 this.#map.removeLayer(this.#accuracyCircle);
//             }
//
//             this.#currentPositionMarker = L.marker([lat, lon]).addTo(this.#map);
//             this.#accuracyCircle = L.circle([lat, lon], {radius: accuracy}).addTo(this.#map);
//
//             console.log({lat, lon, accuracy});
//
//             if (this.geolocationMode === GEOLOCATION_MODE.MANUAL) {
//                 return;
//             }
//
//             // this.#map.setView([lat, lon], 15);
//         };
//
//         const handleError = (error) => {
//             console.error("Error obtaining geolocation: ", error);
//         };
//
//         const opts = {
//             enableHighAccuracy: true,
//             maximumAge: 0,
//             timeout: 5000
//         };
//         navigator.geolocation.getCurrentPosition(updatePosition, handleError, opts);
//         navigator.geolocation.watchPosition(updatePosition, handleError, opts);
//     }
//
//     #addGeoJson(geo) {
//         L
//             .geoJSON(geo, {
//                 style: function (feature) {
//                     if (feature.geometry.type === 'LineString') {
//                         return { color: 'red', weight: 10 };
//                     }
//                     return { color: 'blue' };
//                 }
//             })
//             .bindPopup(function (layer) {
//                 return layer.feature.properties.description || 'No description';
//             })
//             .addTo(this.#map);
//
//         this.#map.invalidateSize();
//     }
//
//    
//     async #prepareReport() {
//         const reportId = await fetch("/Map/CreateReport", { method: "POST"});
//         if (reportId.ok) {
//             const json = await reportId.json();
//             return json;
//         }
//        
//         return null;
//     }
// }

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

    createForm(fields, onSubmit, onCancel) {
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
    }
}

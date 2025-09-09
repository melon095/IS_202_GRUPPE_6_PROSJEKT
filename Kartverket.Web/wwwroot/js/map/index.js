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

window.Map = new class {
    #geojson = [];
    #div = null;
    #map = null;
    #currentPositionMarker = null;
    #accuracyCircle = null;
    
    lineState = null;
    geolocationMode = GEOLOCATION_MODE.AUTO_MOVE;
    
    get map() {
        return this.#map;
    }
    
    load(geojson, div) {
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
        this.#addButtons();
        this.#geolocationTimer();
    }

    setDragging(enabled) {
        if (enabled)
            this.#map.dragging.enable();
        else 
            this.#map.dragging.disable();
    }
    
    async addPoint(point) {
        const response = await fetch("/Map/AddPoint", {
            method: "POST",
            body: JSON.stringify(point),
            headers: {"Content-Type": "application/json"}
        });
        
        if (response.ok) {
            const newPoint = await response.json();
            this.#addGeoJson(newPoint);
        }
    }
    
    async addLines(coords) {
        const req = {
            points: coords
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
            
            this.#map.setView([lat, lon], 15);
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
    
    #addButtons() {
        const that = this;
        const control = L.Control.extend({
            options: {
                position: 'topright'
            },
            onAdd: function (map) {
                let activeButtonType = ACTIVE_BUTTON_TYPE.PAN;
                
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
                container.style.backgroundColor = 'white';
                container.style.padding = '5px';

                const panButton = L.DomUtil.create('button', '', container);
                panButton.innerHTML = 'Pan';
                panButton.style.display = 'block';
                panButton.style.marginBottom = '5px';

                panButton.onclick = () => {
                    activeButtonType = ACTIVE_BUTTON_TYPE.PAN;
                };
                
                const addButton = L.DomUtil.create('button', '', container);
                addButton.innerHTML = 'Add point';
                addButton.style.display = 'block';
                
                addButton.onclick = () => {
                    activeButtonType = ACTIVE_BUTTON_TYPE.ADD;
                };
                
                const lineButton = L.DomUtil.create('button', '', container);
                lineButton.innerHTML = 'Add line';
                lineButton.style.display = 'block';
                
                lineButton.onclick = () => {
                    activeButtonType = ACTIVE_BUTTON_TYPE.LINE;
                };
                
                // const geolocationModeButton = L.DomUtil.create('button', '', container);
                // geolocationModeButton.innerHTML = 'Follow Position';
                // geolocationModeButton.style.display = 'block';
                // geolocationModeButton.style.marginTop = '5px';
                //
                // geolocationModeButton.onclick = () => {
                //     if (that.geolocationMode === GEOLOCATION_MODE.AUTO_MOVE) {
                //         that.geolocationMode = GEOLOCATION_MODE.MANUAL;
                //         geolocationModeButton.innerHTML = 'Manual Position';
                //     } 
                //     else if (that.geolocationMode === GEOLOCATION_MODE.MANUAL) {
                //         that.geolocationMode = GEOLOCATION_MODE.AUTO_MOVE;
                //         geolocationModeButton.innerHTML = 'Follow Position';
                //     }
                // };

                L.DomEvent.disableClickPropagation(container);
                
                const HUNDRED_MS = 100;
                setInterval(() => {
                    switch(activeButtonType)
                    {
                        case ACTIVE_BUTTON_TYPE.PAN:
                            window.Map.setDragging(true);
                            break;

                        case ACTIVE_BUTTON_TYPE.ADD:
                        case ACTIVE_BUTTON_TYPE.LINE:
                            window.Map.setDragging(false);
                            break;

                        default:
                            console.error("Unknown activeButtonType: " + activeButtonType);
                            break;
                    }
                }, HUNDRED_MS);

                window.Map.map.on('click', async (e) => {
                    if(activeButtonType === ACTIVE_BUTTON_TYPE.ADD)
                    {
                        const coord = e.latlng;
                        const point = {
                            Latitude: coord.lat,
                            Longitude: coord.lng,
                        };

                        await that.addPoint(point);
                    }

                    if(activeButtonType === ACTIVE_BUTTON_TYPE.LINE)
                    {
                        if (that.lineState == null)
                        {
                            that.lineState = [];
                        }
                        
                        that.lineState.push(e.latlng);
                        let prevItem = null, newItem = null;
                        if (that.lineState.length >= 2)
                        {
                            prevItem = that.lineState[that.lineState.length - 2];
                            newItem = that.lineState[that.lineState.length - 1];
                        }
                        else
                        {
                            prevItem = that.lineState[that.lineState.length - 1];
                            newItem = that.lineState[that.lineState.length - 1];
                        }
                        
                        L.polyline([
                                [prevItem.lat, prevItem.lng], 
                                [newItem.lat, newItem.lng]
                            ],
                            {
                                color: 'red'
                            }
                        ).addTo(window.Map.map);
                    }
                    
                    // if (that.geolocationMode === GEOLOCATION_MODE.AUTO_MOVE)
                    // {
                    //     that.geolocationMode = GEOLOCATION_MODE.MANUAL;
                    //     geolocationModeButton.innerHTML = 'Manual Position';
                    // }
                });
                
                window.Map.map.on("dblclick", async (e) => {
                    if (that.lineState === null || 
                        that.lineState.length <= 1)
                    {
                        return;
                    }
                    
                    const coords = that.lineState
                        .map(({lat,lng}) => ({latitude: lat, longitude: lng}));
                    
                    await that.addLines(coords);
                    
                    that.lineState = null;
                });
  
                return container;
            }
        });
        
        this.#map.addControl(new control());
    }
}

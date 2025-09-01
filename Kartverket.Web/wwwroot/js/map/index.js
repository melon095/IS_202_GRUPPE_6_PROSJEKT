const ACTIVE_BUTTON_TYPE = {
    PAN: 'PAN',
    ADD: 'ADD'
}

const TILE_LAYER_URL = 'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png';
const TILE_LAYER_COPYRIGHT = `&copy; <a href="http://www.kartverket.no/">Kartverket</a>`;
    
window.Map = new class {
    #points = [];
    #div = null;
    #map = null;
    
    get map() {
        return this.#map;
    }
    
    load(points, div) {
        this.#points = points;
        this.#div = div;
        this.#map = L.map(this.#div, {
            center: [58.14654566028351, 7.991145057860376],
            zoom: 15
        })

        L.tileLayer(TILE_LAYER_URL, {
            maxZoom: 19,
            attribution: TILE_LAYER_COPYRIGHT
        }).addTo(this.#map);

        const latlngs = this.#points.map(p => [p.Latitude, p.Longitude]);
        const polyline = L.polyline(latlngs, {color: 'red'}).addTo(this.#map);
        this.#map.fitBounds(polyline.getBounds());

        for (const point of this.#points) {
            L.circleMarker([point.Latitude, point.Longitude], {radius: 5, color: 'blue'}).addTo(this.#map);
        }
    }

    setDragging(enabled) {
        if (enabled)
            this.#map.dragging.enable();
        else 
            this.#map.dragging.disable();
    }
    
    async addPoint(point) {
        await fetch("/Home/AddPoint", {
            method: "POST",
            body: JSON.stringify(point),
            headers: {"Content-Type": "application/json"}
        });
        
        this.#points.push(point);
        L.circleMarker([point.Latitude, point.Longitude], {radius: 5, color: 'blue'}).addTo(this.#map);
        this.#map.invalidateSize();
    }
}

window.mapRun = function() {
    let activeButtonType;
    
    const addToDiv = (elem) => {
        const div = document.getElementById('underMap');
        div.appendChild(elem);
    };
    
    const panButton = document.createElement('button');
    panButton.textContent = "Pan";
    
    panButton.onclick = () => {
        activeButtonType = ACTIVE_BUTTON_TYPE.PAN;
    };
    
    const addButton = document.createElement('button');
    addButton.textContent = "Add point";
    
    addButton.onclick = () => {
        activeButtonType = ACTIVE_BUTTON_TYPE.ADD;
    };
    
    addToDiv(panButton);
    addToDiv(addButton);
    
    activeButtonType = ACTIVE_BUTTON_TYPE.PAN;
    
    const HUNDRED_MS = 100;
    setInterval(() => {
        switch(activeButtonType)
        {
            case ACTIVE_BUTTON_TYPE.PAN:
                window.Map.setDragging(true);
                break;
    
            case ACTIVE_BUTTON_TYPE.ADD:
                window.Map.setDragging(false);
                break;
    
            default:
                console.error("Unknown activeButtonType: " + activeButtonType);
                break;
        };
    }, HUNDRED_MS);
    
    window.Map.map.on('click', async (e) => {
        if(activeButtonType === ACTIVE_BUTTON_TYPE.ADD)
        {
            const coord = e.latlng;
            const point = {
                Latitude: coord.lat,
                Longitude: coord.lng,
            };
    
            await window.Map.addPoint(point);
        }
    });
}

import { Component, ViewChild, ElementRef } from '@angular/core';
import { Network } from '@ionic-native/network/ngx';
import L from 'leaflet';
import { DatabaseService } from '../_services/database.service';
import { GeolocationOriginal } from 'node_modules_2/@ionic-native/geolocation';
import { resolve } from 'url';

// npm uninstall leaflet-tilelayer-mbtiles-ts --save for use this:
/* import 'leaflet';
import 'leaflet-tilelayer-mbtiles-ts';*/

// declare var L: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('map', {static: false}) mapContainer: ElementRef;
  map: any;

  tiles = {};
  constructor(
    public network: Network,
    private db: DatabaseService,
  ) {

  }

  ionViewDidEnter() {
    this.loadmap();
  }

  loadmap() {
    const global = this;

    if ( this.network && this.network.type !== 'unknown' && this.network.type !== 'none' ) {
      console.log('si tiene internet');
      this.map = L.map('map').fitWorld();
      L.tileLayer('https://mt0.google.com/vt/lyrs={lyrs}&z={z}&x={x}&y={y}',
        { maxZoom: 18,
          attribution: 'Google',
          lyrs: 'p'
        }
      ).addTo(this.map);
      this.map.locate({
        setView: true,
        maxZoom: 16,
        minZoom: 12
      }).on('locationfound', (e) => {
        const markerGroup = L.featureGroup();
        const marker: any = L.marker([e.latitude, e.longitude], 5).on('click', () => {
          alert('Marker clicked');
        });
        markerGroup.addLayer(marker);
        this.map.addLayer(markerGroup);
        }).on('locationerror', (err) => {
          alert(err.message);
      });
    } else {

      L.TileLayer.MBTiles = L.TileLayer.extend({
        mbTilesDB: null,
        initialize(url, options, db) {
          this.mbTilesDB = db;
          L.Util.setOptions(this, options);
        },
        getTileUrl(tilePoint) {
          const z = this._getZoomForUrl();
          const x = tilePoint.x;
          const y = Math.pow(2, z) - tilePoint.y - 1;

          this.mbTilesDB.executeSql('SELECT hex(tile_data) AS tile FROM tiles '
            + 'WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?;', [z, x, y]).then((res) => {

            const base64String = btoa((res.rows.item(0).tile).match(/\w{2}/g)
            .map(a => {
              return String.fromCharCode(parseInt(a, 16));
            }).join(''));
            console.log('seteando', tilePoint.x + '-' + tilePoint.y + '-' + tilePoint.z);
            global.tiles[tilePoint.x + '-' + tilePoint.y + '-' + tilePoint.z] = 'data:image/jpg;base64,' + base64String;

          }, (error) => {
            console.log('SELECT error: ' + error.message);
          });
        }
      });
      this.buildMapOffline();
    }
  }

  buildMapOffline() {

    this.db.mbTilesDB$.subscribe( (mbTilesDB) => {
      if ( mbTilesDB ) {

        this.map = L.map('map', {
          center: new L.LatLng(-30.036286, -51.220186),
          attributionControl: true,
          zoom: 14,
          maxZoom: 17,
          minZoom: 12,
          maxBounds: new L.LatLngBounds(new L.LatLng(-30.1876, -51.1003), // southWest
          new L.LatLng(-29.9651, -51.2692) // northEast
          )
        });

        const lyr = new L.TileLayer.MBTiles('', {
          minZoom : 12,
          maxZoom : 17,
          tms : true
        }, mbTilesDB);

        lyr.addTo(this.map);

        const context = this;
        lyr.on('tileerror', (tileEvent) => {
          const coords = tileEvent.coords;
          setTimeout(() => {
            tileEvent.tile.src = context.tiles[coords.x + '-' + coords.y + '-' + coords.z];
          }, 1000);
        });

        const markerGroup = L.featureGroup();
        const marker: any = L.marker([-30.036286, -51.220186], 5).on('click', () => {
          console.log('Marker clicked');
        });
        markerGroup.addLayer(marker);
        this.map.addLayer(markerGroup);

      }
    });
  }
}

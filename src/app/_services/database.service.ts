import { Platform, Events } from '@ionic/angular';
import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { SqliteDbCopy } from '@ionic-native/sqlite-db-copy/ngx';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

export class DatabaseService {

  private database: SQLiteObject;

  private isOpen = false;
  private isOpenSbj = new BehaviorSubject<boolean>(this.isOpen);
  public isOpen$ = this.isOpenSbj.asObservable();

  private mbTilesDB: SQLiteObject;
  private mbTilesDBSbj = new BehaviorSubject<SQLiteObject>(this.mbTilesDB);
  public mbTilesDB$ = this.mbTilesDBSbj.asObservable();

  constructor(
    private plt: Platform,
    private sqlite: SQLite,
    public events: Events,
    private sqliteDbCopy: SqliteDbCopy
  ) {
    this.setUp();
  }

  private setUp() {

    this.plt.ready().then(() => {

      if ( !this.plt.is('desktop') ) {
        try {
          this.copyDatabase();
          /*this.sqlite.create({
            name: 'risks.db',
            location: 'default'
          }).then((db: SQLiteObject) => {
              this.database = db;
              this.seedDatabase();
          });*/
        } catch (e) {
          console.log('ERROR on setUp', e);
        }
      }

    });

  }

  seedDatabase() {
    this.isOpen = true;
    this.isOpenSbj.next(this.isOpen);
    this.mbTilesDB = this.database;
    this.mbTilesDBSbj.next(this.mbTilesDB);

    /*const query = `SELECT tile_data FROM images Limit 1`;
    this.database.executeSql(query).then(data => {
      console.log('success query');
      if (data.rows.length > 0) {
        console.log('cantidad de registros', data.rows.length);
      }
    });*/
  }

  copyDatabase() {
    this.sqliteDbCopy.copy('poa-maps-osm.mbtiles', 0)
    .then((res: any) => {
      console.log(res);
      this.sqlite.create({
        name: 'poa-maps-osm.mbtiles',
        location: 'default',
        createFromLocation: 1,
      }).then((db: SQLiteObject) => {
        this.database = db;
        this.seedDatabase();
      }, (error) => {
        console.error('Unable to open database', error);
      });
    })
    .catch((error: any) => {
      console.error(error);
      this.sqlite.create({
        name: 'poa-maps-osm.mbtiles',
        location: 'default',
        createFromLocation: 1,
      }).then((db: SQLiteObject) => {
        this.database = db;
        this.seedDatabase();
      }, (error) => {
        console.error('Unable to open database', error);
      });
    });
  }

}

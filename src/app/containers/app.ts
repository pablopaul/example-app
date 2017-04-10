import 'rxjs/add/operator/let';
import { Observable } from 'rxjs/Observable';
import { Component, ChangeDetectionStrategy, OnInit, AfterViewChecked } from '@angular/core';
import { Store } from '@ngrx/store';

import * as fromRoot from '../reducers';
import * as layout from '../actions/layout';
import * as collection from '../actions/collection';

import { WindowRef } from '../services/WindowRef';
import { startFPSMonitor, startMemMonitor, initProfiler, startProfile, endProfile } from "perf-monitor";

@Component({
  selector: 'bc-app',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `

    <style>
      table {border-collapse:collapse;border-spacing:0;}
      :before,:after {box-sizing: border-box;}

      .table > thead > tr > th,.table > tbody > tr > th,.table > tfoot > tr > th,.table > thead > tr > td,.table > tbody > tr > td,.table > tfoot > tr > td {border-top:1px solid #ddd;line-height:1.42857143;padding:8px;vertical-align:top;}
      .table {width:100%;}
      .table-striped > tbody > tr:nth-child(odd) > td,.table-striped > tbody > tr:nth-child(odd) > th {background:#f9f9f9;}

      .label {border-radius:.25em;color:#fff;display:inline;font-size:75%;font-weight:700;line-height:1;padding:.2em .6em .3em;text-align:center;vertical-align:baseline;white-space:nowrap;}
      .label-success {background-color:#5cb85c;}
      .label-warning {background-color:#f0ad4e;}

      .popover {background-color:#fff;background-clip:padding-box;border:1px solid #ccc;border:1px solid rgba(0,0,0,.2);border-radius:6px;box-shadow:0 5px 10px rgba(0,0,0,.2);display:none;left:0;max-width:276px;padding:1px;position:absolute;text-align:left;top:0;white-space:normal;z-index:1010;}
      .popover>.arrow:after {border-width:10px;content:"";}
      .popover.left {margin-left:-10px;}
      .popover.left > .arrow {border-right-width:0;border-left-color:rgba(0,0,0,.25);margin-top:-11px;right:-11px;top:50%;}
      .popover.left > .arrow:after {border-left-color:#fff;border-right-width:0;bottom:-10px;content:" ";right:1px;}
      .popover > .arrow {border-width:11px;}
      .popover > .arrow,.popover>.arrow:after {border-color:transparent;border-style:solid;display:block;height:0;position:absolute;width:0;}

      .popover-content {padding:9px 14px;}

      .Query {position:relative;}
      .Query:hover .popover {display:block;left:-100%;width:100%;}
    </style>
    <div>
      <table class='table table-striped latest-data'>
        <tbody>
        <tr *ngFor="let db of dbData$ | async">
          <td class='dbname'>{{db.dbname}}</td>
          <td class='query-count'>
            <span [class]='db.lastSample.countClassName'>{{db.lastSample.nbQueries}}</span>
          </td>
          <td *ngFor='let q of db.lastSample.topFiveQueries' class='Query {{q.elapsedClassName}}'>
            {{q.formatElapsed}}
            <div class='popover left'>
              <div class='popover-content'>{{q.query}}</div>
              <div class='arrow'></div>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    
    <bc-layout>
      <bc-sidenav [open]="showSidenav$ | async">
        <bc-nav-item (activate)="closeSidenav()" routerLink="/" icon="book" hint="View your book collection">
          My Collection
        </bc-nav-item>
        <bc-nav-item (activate)="closeSidenav()" routerLink="/book/find" icon="search" hint="Find your next book!">
          Browse Books
        </bc-nav-item>
      </bc-sidenav>
      <bc-toolbar (openMenu)="openSidenav()">
        Book Collection
      </bc-toolbar>

      <router-outlet></router-outlet>
    </bc-layout>
  `
})
export class AppComponent implements OnInit, AfterViewChecked {

  _window: any;
  dbData$: any;
  showSidenav$: Observable<boolean>;

  constructor(private store: Store<fromRoot.State>, private winRef: WindowRef) {

    this._window = winRef.nativeWindow;
    this._window.renderStage = 0;


    /**
     * Selectors can be applied with the `select` operator which passes the state
     * tree to the provided selector
     */
    this.showSidenav$ = this.store.select(fromRoot.getShowSidenav);
    this.dbData$ = this.store.select(fromRoot.getCollectionDbData);

    this.update();
  }

  update() {
    requestAnimationFrame(function() {self.update()});

    const self = this;

    // Re new data
    //self.databases = self.booksService.getDbData();
    this.store.dispatch(new collection.GetDbData());

    if (self._window.renderStage === 0) {
      self._window.renderStage = 1;
      startProfile("render")
    }
  }

  ngOnInit() {
    console.log("on Init");
    this._window.renderStage = 0;
    startFPSMonitor();
    startMemMonitor();
    initProfiler("render");
  }

  ngAfterViewChecked() {
    if (this._window.renderStage === 1) {
      endProfile("render");
      this._window.renderStage = 0;
    }
  }


  closeSidenav() {
    /**
     * All state updates are handled through dispatched actions in 'container'
     * components. This provides a clear, reproducible history of state
     * updates and user interaction through the life of our
     * application.
     */
    this.store.dispatch(new layout.CloseSidenavAction());
  }

  openSidenav() {
    this.store.dispatch(new layout.OpenSidenavAction());
  }
}

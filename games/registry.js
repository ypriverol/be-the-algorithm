import * as envelope from './envelope.js';
import * as feature from './feature.js';
import * as method from './method.js';
import * as detective from './detective.js';
import * as mbr from './mbr.js';
import * as spectrum from './spectrum.js';

export const games = {
  envelope: { render: envelope.render },
  feature:  { render: feature.render },
  method:   { render: method.render },
  detective: { render: detective.render },
  mbr: { render: mbr.render },
  spectrum: { render: spectrum.render },
};
export const gameIds = ['envelope','feature','method','detective','mbr','spectrum'];

import * as envelope from './envelope.js';
import * as feature from './feature.js';
import * as method from './method.js';
import * as detective from './detective.js';
import * as mbr from './mbr.js';

export const games = {
  envelope: { render: envelope.render },
  feature:  { render: feature.render },
  method:   { render: method.render },
  detective: { render: detective.render },
  mbr: { render: mbr.render },
};
export const gameIds = ['envelope','feature','method','detective','mbr'];

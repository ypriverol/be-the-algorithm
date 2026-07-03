import * as envelope from './envelope.js';
import * as feature from './feature.js';
import * as method from './method.js';

export const games = {
  envelope: { render: envelope.render },
  feature:  { render: feature.render },
  method:   { render: method.render },
};
export const gameIds = ['envelope','feature','method'];

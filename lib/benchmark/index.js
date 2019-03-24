/* eslint-disable */

require('@babel/register')({
    presets: ['@babel/env'],
    plugins: ['@babel/plugin-proposal-object-rest-spread'],
});

const { generateRandomGraph } = require('../../examples/test/random');
const { reduceGraph } = require('../optimize');

const { format } = require('../util');

const data = require('../../examples/data/chart_data2');

const formattedData = generateRandomGraph(0, 100, 3, 10000000, 10); //format(data[0]);

const COUNT = 1000;
const COUNT2 = 192;
let g;
for(let i = 0; i < COUNT; i++) {
   g = reduceGraph(formattedData, COUNT2);
}

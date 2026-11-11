import process from 'process';
import { Buffer } from 'buffer';
import './style.css';
import { Game } from './game.js';

globalThis.process = process;
globalThis.Buffer = Buffer;
process.browser = true;
process.env = process.env || {};
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const game = new Game(document.querySelector('#app'));
game.start();

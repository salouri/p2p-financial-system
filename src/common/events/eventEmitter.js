import EventEmitter from 'events';

class AuctionEventEmitter extends EventEmitter {}
const eventEmitter = new AuctionEventEmitter();

export default eventEmitter;

import { createStore } from 'redux';
import { moduleReducer, roomReducer } from './reducer';


// think of each store / 'state slice' as a 'topic' (in mqtt terms)
export const roomStore = createStore(roomReducer);
export const moduleStore = createStore(moduleReducer);

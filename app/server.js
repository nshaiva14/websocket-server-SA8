import socketio from 'socket.io';
import http from 'http';
import throttle from 'lodash.throttle';
import debounce from 'lodash.debounce';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import * as Notes from './controllers/note_controller';


// add server and io initialization after app
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// DB Setup
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost/notes';
mongoose.connect(mongoURI);
// set mongoose promises to es6 default
mongoose.Promise = global.Promise;

// enable/disable cross origin resource sharing if necessary
app.use(cors());

app.set('view engine', 'ejs');
app.use(express.static('static'));
// enables static assets from folder static
app.set('views', path.join(__dirname, '../app/views'));
// this just allows us to render ejs from the ../app/views directory

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// default index route
app.get('/', (req, res) => {
  res.send('hi');
});


// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
server.listen(port);
console.log(`listening on: ${port}`);

// at the bottom of server.js
// lets register a connection listener
io.on('connection', (socket) => {
  // on first connection emit notes
  Notes.getNotes().then((result) => {
    socket.emit('notes', result);
  });

  // add these at the top of your: io.on('connection' section
  let emitToSelf = (notes) => {
    socket.emit('notes', notes);
  };
  emitToSelf = debounce(emitToSelf, 200);

  let emitToOthers = (notes) => {
    socket.broadcast.emit('notes', notes);
  };
  emitToOthers = throttle(emitToOthers, 25);

  const pushNotesSmoothed = () => {
    Notes.getNotes().then((result) => {
      emitToSelf(result);
      emitToOthers(result);
    });
  };
  // pushes notes to everybody
  const pushNotes = () => {
    Notes.getNotes().then((result) => {
      // broadcasts to all sockets including ourselves
      io.sockets.emit('notes', result);
    });
  };

  // creates notes and
  socket.on('createNote', (fields) => {
    Notes.createNote(fields).then((result) => {
      pushNotes();
    }).catch((error) => {
      console.log(error);
      socket.emit('error', 'create failed');
    });
  });


// on update note do what is needful
  socket.on('updateNote', (id, fields) => {
    Notes.updateNote(id, fields).then(() => {
      // inside of your updateNote success .then
      if (fields.text) {
        pushNotes();
      } else {
        pushNotesSmoothed();
      }
    });
  });


// / on deleteNote do what is needful
  socket.on('deleteNote', (id) => {
    Notes.deleteNote(id).then(() => {
      pushNotes();
    }).catch((error) => {
      console.log(error);
      socket.emit('error', 'delete failed');
    });
  });
});

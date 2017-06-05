import Note from '../models/note_model';


export const getNotes = () => {
  return Note.find({}).then((notes) => {
    return notes.reduce((result, item) => {
      result[item.id] = item;
      return result;
    }, {});
  });
};

export const deleteNote = (id) => {
  console.log('deleting');
  return Note.findByIdAndRemove(id);
  // to quote Prof. Cormen: left as an exercise to the reader
  // remember to return the mongoose function you use rather than just delete
};

export const createNote = (fields) => {
  const n = new Note();
  n.text = fields.text;
  n.imageURL = fields.imageURL;
  return n.save();
  // you know the drill. create a new Note mongoose object
  // return .save()
};

export const updateNote = (id, fields) => {
  return Note.findById(id)
  .then((note) => {
    // check out this classy way of updating only the fields necessary
    Object.keys(fields).forEach((k) => {
      note[k] = fields[k];
    });
    return note.save();
  });
};

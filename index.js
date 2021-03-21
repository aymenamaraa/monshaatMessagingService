const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const mongoose = require("mongoose");
const config = require("./config");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const communityChat = require("./models/communityChat.model");
// const user = require("./models/chatUser.model");

app.get("/oldmessages/:authUser/:correspondant", cors(), (req, res) => {
  communityChat
    .find({
      $or: [
        { sender: req.params.authUser, reciver: req.params.correspondant },
        { sender: req.params.correspondant, reciver: req.params.authUser },
      ],
    })
    .exec((err, docs) => {
      console.log("docs", docs);
      err ? res.end() : res.send(docs);
    });


  communityChat.updateMany(
	 { seen: false, reciver: req.params.authUser },
    { $set: { seen: true } },
    { multi: true },
    (err, writeResult) => {
      if (err) console.log("updateMany err", err);
      console.log("updateMany", writeResult);
    }
  );
});


app.get("/countUnseen/:authUser",cors(),(req,res)=>{

communityChat.find({ $and:[{reciverId: req.params.authUser},{seen: false},]})
			.exec((err, docs)=>{
				if(err) console.log("db err", err)
				else res.send({count: docs.length});
					   })
})

app.get("/conversationHistory/:authUser", cors(), (req, res) => {
  console.log(req.params.authUser);
  let correspondants = [];
  communityChat
    .find({
      $or: [
        { senderId: req.params.authUser },
        { reciverId: req.params.authUser },
      ],
    })
    .sort({ created_at: "desc" })
    .exec((err, docs) => {
      if (err) console.log("db err: ", err);
      else {
        let c = [];
        docs.map((item) => {
          console.log("item", item);
          console.log("item.senderId", item.senderId);
          console.log("req.params.authUser", parseInt(req.params.authUser));
          console.log(item.senderId == parseInt(req.params.authUser));
          if (item.senderId == parseInt(req.params.authUser))
            c = [
              ...c,
             {
                id: item.reciverId,
                complete_name: item.reciver,
               seen:true,
             },
            ];
          else
           c = [
              ...c,
              {
                id: item.senderId,
                complete_name: item.sender,
                seen: item.seen,
              },
            ];
        });
        //const listInt = new Set(c.map(x => x.id));
      //  correspondants = [...listInt];
 
             const map = new Map();
        for (const item of c) {
            if(!map.has(item.id)){
                map.set(item.id, true);    // set any value to Map
                correspondants.push({
                    id: item.id,
                    complete_name: item.complete_name,
                    seen: item.seen,
                });
            }
        }
 res.send(correspondants);
      }
    });
});

io.on("connection", (socket) => {
  console.log("user connected", socket.id);

  socket.on("chat message", (msg) => {
//    io.emit("chat message", msg);
    console.log("msg", msg);


 const interMsg = {
       content: msg.content,
      sender: msg.sender,
      reciver: msg.reciver,
      senderId: msg.senderId,
      reciverId: msg.reciverId,
      created_at: new Date(),
seen: msg.seen  
  };

 io.emit("chat message", interMsg);

    let chatMessage = new communityChat(interMsg);
    chatMessage.save();
//    io.emit("chat message", interMsg);
  });
});

//save chat to the database
mongoose
  .connect(config.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true,
  })
  .then((db) => {
    console.log("connected correctly to DB");
  });

server.listen(config.PORT, () =>
  console.log("server running on port:" + config.PORT)
);

const { MongoClient } = require("mongodb");

// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = "mongodb://localhost:27017";
const client = new MongoClient(url);

const users = require("./user");
// Database Name
const dbName = "social-network";

async function main() {
  // Use connect method to connect to the server
  await client.connect();
  console.log("Connected successfully to server");
  const db = client.db(dbName);
  const userCollection = db.collection("users");
  const postCollection = db.collection("posts");
  const commentCollection = db.collection("comments");

  const generateUserCollection = async () => {
    return userCollection.insertMany(
      users.map((user) => ({ ...user, createdAt: new Date() }))
    );
  };

  const dropUserCollection = async () => {
    return userCollection.deleteMany({});
  };
  const dropPostCollection = async () => {
    return postCollection.deleteMany({});
  };
  const dropCommentCollection = async () => {
    return commentCollection.deleteMany({});
  };

  const deleteOneUser = async (username) => {
    return userCollection.deleteOne({ username });
  };

  const updateOneUser = async (username, nextUsername) => {
    return userCollection.updateOne(
      { username },
      { $set: { username: nextUsername } }
    );
  };

  const getUserId = (username) => {
    return userCollection.findOne(
      { username: username },
      { projection: { _id: 1 } }
    );
  };

  const createOnePost = async (username, urlPhoto, description) => {
    var usernameid = await getUserId(username);
    usernameid = usernameid._id;
    return postCollection.insertOne({
      usernameid,
      urlPhoto,
      description,
      createdAt: new Date(),
    });
  };

  const getPosts = async () => {
    const posts = await postCollection
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "usernameid",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $lookup: {
            from: "comments",
            localField: "comments",
            foreignField: "_id",
            as: "comments",
            pipeline: [
              {
                $lookup: {
                  from: "users",
                  localField: "userId",
                  foreignField: "_id",
                  as: "user",
                },
              },
              { $unwind: "$user" },
              { $project : {userId:0}}
            ],
          },
        },
        { $unwind: "$user" },
        { $project : {usernameid:0}}
      ])
      .toArray();

    console.log(posts);
  };

  const addCommentToPost = async (username, comment) => {
    const user = await getUserId(username);
    const result = await commentCollection.insertOne({
      userId: user._id,
      comment,
      createdAt: new Date(),
    });
    const post = await postCollection.find({}).toArray();
    await postCollection.updateOne(
      { _id: post[Math.floor(Math.random() * 2)]._id },
      { $push: { comments: result.insertedId } }
    );
  };
  await dropUserCollection();
  await generateUserCollection();
  await dropPostCollection();
  // await deleteOneUser("John Cena")
  // await updateOneUser("John Cena", "John ccena");
  await createOnePost(
    "John Cena",
    "https://img.passeportsante.net/1200x675/2021-06-01/i107848-eduquer-un-chaton.jpeg",
    "hello toi mon chou"
  );
  await createOnePost(
    "Oui baguette",
    "https://www.detentejardin.com/sites/art-de-vivre/files/dj115_chaton_jardin_annala.jpg",
    "Je te reponds mi amor"
  );
  await dropCommentCollection();
  await addCommentToPost("John Cena", "trop fort oui oui baguette !");
  await addCommentToPost("Jean Eude", "Jerome ! Que tu es marrant");
  await addCommentToPost("Oui baguette", "Y a une baguette ici ?");
  await addCommentToPost("John Cena", "Est ce que mon commentaire est posté ?");
  await addCommentToPost("John Cena", "Au cas ou je le remet");
  await addCommentToPost("John Cena", "trop fort oui oui baguette !");
  await addCommentToPost("John Cena", "Liam est dyslexique");
  await getPosts();

  // the following code examples can be pasted here...

  return "done.";
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => client.close());

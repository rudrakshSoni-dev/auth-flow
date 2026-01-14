import "dotenv/config"
import app from "./app.js"
import connectDB from "./config/db.js";

const port = process.env.PORT || 4000;

async function start(){
    try{
        app.listen(port,()=>{
            console.log(`Server running on http://localhost:${port}`)
        });
    } catch(err){
        console.error("",err);
        process.exit(1);
    }
}

connectDB();
start();
import express from "express"
import cors from "cors"
import 'dotenv/config'
import cookieParser from "cookie-parser"

const app = express()
const port = process.env.PORT || 4000

app.use(cors({credentials: true}))
app.use(cookieParser());
app.use(express.json());


app.get('/', (req,res)=>{
    res.send("API is working")
})
app.listen(port , ()=> console.log(`Server started on PORT:${port}`))
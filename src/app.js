import express from "express"
import cors from "cors"
import 'dotenv/config'
import cookieParser from "cookie-parser"
import authRoutes from "./routes/auth.routes.js"

const app = express()
const port = process.env.PORT || 4000

app.use(cors({
  origin: process.env.FRONTEND_URL, 
  credentials: true
}));
app.options(/.*/, cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use("/api/auth", authRoutes);
app.set("trust proxy", 1);



app.get('/', (req,res)=>{
    res.send(`API is working fine`);
})



app.get('/health', (req,res)=>{
    res.json({ok:true, uptime:process.uptime()});
})

export default app;
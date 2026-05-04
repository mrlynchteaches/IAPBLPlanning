require('dotenv').config();
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname,'..','frontend')));

function sign(user){ return jwt.sign({id:user.id,role:user.role,display:user.display_name},JWT_SECRET,{expiresIn:'8h'}); }
function auth(req,res,next){ const t=req.cookies.session; if(!t) return res.status(401).end(); try{ req.user=jwt.verify(t,JWT_SECRET); next(); }catch{ return res.status(401).end(); }}
function admin(req,res,next){ if(req.user.role!=='admin') return res.status(403).end(); next(); }

async function logAudit(actor,action,targetType,targetId,summary,details){
  await pool.query('INSERT INTO audit_log (actor_user_id,action_type,target_type,target_id,summary,details) VALUES ($1,$2,$3,$4,$5,$6)',
    [actor,action,targetType,targetId,summary,details]);
}

app.post('/api/auth/login', async (req,res)=>{
  const { email, password } = req.body;
  const r = await pool.query('SELECT * FROM users WHERE email=$1 AND active=true',[email]);
  const u = r.rows[0];
  if(!u || !bcrypt.compareSync(password,u.password_hash)) return res.status(401).json({error:'Invalid'});
  res.cookie('session', sign(u), { httpOnly:true });
  res.json({user:{display:u.display_name,role:u.role}});
});

app.get('/api/auth/me',(req,res)=>{ const t=req.cookies.session; if(!t) return res.json({user:null}); try{ const u=jwt.verify(t,JWT_SECRET); res.json({user:u}); }catch{ res.json({user:null}); }});

app.get('/api/public/pbls', async (req,res)=>{
  const y=Number(req.query.year);
  const r=await pool.query('SELECT * FROM pbl_entries WHERE academic_year=$1',[y]);
  res.json({entries:r.rows});
});

app.get('/api/pbls', auth, async (req,res)=>{
  const y=Number(req.query.year);
  const r=await pool.query('SELECT * FROM pbl_entries WHERE academic_year=$1',[y]);
  res.json({entries:r.rows});
});

app.post('/api/admin/audit', auth, admin, async (req,res)=>{
  const r=await pool.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200');
  res.json({entries:r.rows});
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'..','frontend','index.html')));
app.listen(PORT,()=>console.log('Running on',PORT));

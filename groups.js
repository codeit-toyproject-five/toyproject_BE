import express from 'express';

const app = express();

app.get('api/groups/',(req,res)=>{
  res.send('GET groups')
});

app.listen(3000, () => console.log('Server Started'));
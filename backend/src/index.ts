import { Hono } from 'hono'
import { sign , verify} from "hono/jwt"
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'


const app = new Hono<{
  Bindings: {
    PRISMA_DATABASE_URL: string;
    JWT_SECRET: string;
  }
}>()

app.use('/api/v1/blog/*', async (c , next)=>{
  const header = await c.req.header("Authorization");
  //@ts-ignore
  const responce = await verify(header , c.env.JWT_SECRET)
  if(responce.id){
    await next()
  }
  else return c.json({msg:"error while signing in "} , 403)

})

app.post('/api/v1/signup', async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.PRISMA_DATABASE_URL,
  }).$extends(withAccelerate())
  
  const body = await c.req.json()

  try {
    const user = await prisma.user.create({
      data: {
        email:      body.email,
        password:   body.password,
        name:       body.name,
      }
    })
    const jwt = await sign({id:user.id} , c.env.JWT_SECRET)
    return c.json({
      jwt
    })
  } catch(e) {
    console.log(e)
    c.status(403);
    return c.json({ error: "error while signing up" });
  }
})

app.post('/api/v1/signin', async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.PRISMA_DATABASE_URL,
  }).$extends(withAccelerate())
  
  const body = await c.req.json()

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
      password: body.password
    }
  })

  if (!user || user.password !== body.password) {
    c.status(403);
    return c.json({ error: "invalid credentials" });
  }

  const token = await sign({id:user.id} , c.env.JWT_SECRET)
  return c.json({
    jwt:token
  })
})




app.get('/api/v1/blog/:id', (c) => {
  return c.text('Hello Hono!')
})

app.put('/api/v1/blog', (c) => {
  return c.text('Hello Hono!')
})

app.post('/api/v1/blog', (c) => {
  return c.text('Hello Hono!')
})

export default app

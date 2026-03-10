import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

const app = new Hono()

// app.get('/', (c) => {
//   return c.text('Hello Hono!')
// })

app.post('/api/v1/signup', async (c) => {
  const prisma =new PrismaClient({
    //@ts-ignore
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
  const body = await c.req.json()

  const res = await prisma.user.create({
    data:{
      email:      body.email,
      password:   body.password,
      name:       body.name,
    }
  })

})

app.post('/api/v1/signin', (c) => {
  return c.text('Hello Hono!')
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

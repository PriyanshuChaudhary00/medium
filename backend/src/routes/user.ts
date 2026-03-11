import { Hono } from 'hono'
import { sign , verify} from "hono/jwt"
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

export const userRouter = new Hono<{
  Bindings: {
    PRISMA_DATABASE_URL: string;
    JWT_SECRET: string;
  }
}>()

userRouter.post('/signup', async (c) => {
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

userRouter.post('/signin', async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.PRISMA_DATABASE_URL,
  }).$extends(withAccelerate())
  
 try{   
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
    } catch (e){
      console.log(e)
      c.status(403);
      return c.json({ error: "error while signing up" });
    }
})

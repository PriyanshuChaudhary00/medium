import { Hono } from "hono";
import { sign, verify } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
export const blogRouter = new Hono<{
  Bindings: {
    PRISMA_DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

blogRouter.use("/*", async (c, next) => {
  const header = await c.req.header("Authorization");
  //@ts-ignore
  const responce = await verify(header, c.env.JWT_SECRET);
  if (responce.id) {
    c.set("userId", responce.id as string);
    await next();
  } else return c.json({ msg: "error while signing in " }, 403);
});

blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.PRISMA_DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const authorId = c.get("userId") as string;

  const blog = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
      autherId: authorId,
    },
  });

  return c.json({ id: blog.id });
});

blogRouter.put("/", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.PRISMA_DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  const blog = await prisma.post.update({
    where: {
      id: body.id,
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });
  return c.json({ id: blog.id });
});

blogRouter.get("/", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.PRISMA_DATABASE_URL,
  }).$extends(withAccelerate());

  try{
      const body = await c.req.json();
      const authorId = c.get("userId") as string;

      const blog = await prisma.post.findFirst({
        where: {
          id: body.id,
        },
      });
      return c.json({blog})
  }catch(e){
    console.log(e)
    return c.json({
      msg: "error while fetching blog posts "
    } , 403)
  }

});

blogRouter.get('/bulk' , async(c)=>{
  const prisma = new PrismaClient({
    accelerateUrl: c.env.PRISMA_DATABASE_URL,
  }).$extends(withAccelerate());
  try{
        const All_Blogs = await prisma.post.findMany()
        return c.json({
          All_Blogs
        })
  }catch(e){
    console.log(e)
    return c.json({
      msg:"error while fetching all post "
    })
  }
  
})

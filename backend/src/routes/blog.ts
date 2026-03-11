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
  try {
    const header = c.req.header("Authorization");
    if (!header) {
      return c.json({ msg: "Authorization header missing" }, 403);
    }
    // Support both "Bearer <token>" and bare token
    const token = header.startsWith("Bearer ") ? header.slice(7) : header;
    //@ts-ignore
    const responce = await verify(token, c.env.JWT_SECRET, "HS256");
    if (responce.id) {
      c.set("userId", responce.id as string);
      await next();
    } else {
      return c.json({ msg: "Invalid token" }, 403);
    }
  } catch (e) {
    console.log("JWT verify error:", e);
    return c.json({ msg: "Unauthorized: invalid or expired token" }, 403);
  }
});

blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.PRISMA_DATABASE_URL,
  }).$extends(withAccelerate());

  try {
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
  } catch (e) {
    console.log("POST /blog error:", e);
    return c.json({ msg: "Error while creating blog post", error: String(e) }, 500);
  }
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

blogRouter.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    accelerateUrl: c.env.PRISMA_DATABASE_URL,
  }).$extends(withAccelerate());
  const id = c.req.param("id");
  try {
    const blog = await prisma.post.findFirst({
      where: {
        id: Number(id),
      },
    });
    if (!blog) {
      return c.json({ msg: "Blog not found" }, 404);
    }
    return c.json({ blog });
  } catch (e) {
    console.log(e);
    return c.json({ msg: "Error while fetching blog post" }, 500);
  }
});

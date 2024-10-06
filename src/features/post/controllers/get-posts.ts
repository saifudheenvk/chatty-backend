import HTTP_STATUS from 'http-status-codes';
import { IPostDocument } from '@post/interfaces/post.interface';
import { postService } from '@services/db/post.service';
import { PostCache } from '@services/redis/post.cache';
import { Request, Response } from 'express';



const PAGE_SIZE = 10;
const postCache = new PostCache();

export class Get {
  public async posts(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip = (parseInt(page) - 1) * PAGE_SIZE;
    const limit = PAGE_SIZE * parseInt(page);
    const newSkip = skip === 0? skip : skip + 1;
    let posts: IPostDocument[] = [];
    let totalPost = 0;
    const cachedPosts: IPostDocument[] = await postCache.getPostsFromCache('post', newSkip, limit);
    if (cachedPosts.length) {
      posts = cachedPosts;
      totalPost = await postCache.getTotalPostsInCache();
    } else {
      posts = await postService.getPosts({}, skip, limit, { createdAt: -1 });
      totalPost = await postService.postsCount();
    }
    res.status(HTTP_STATUS.OK).json({ message: 'All posts', posts, totalPost });
  }

  public async postsWithImages(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip = (parseInt(page) - 1) * PAGE_SIZE;
    const limit = PAGE_SIZE * parseInt(page);
    const newSkip = skip === 0? skip : skip + 1;
    let posts: IPostDocument[] = [];
    const cachedPosts: IPostDocument[] = await postCache.getPostsWithImagesFromCache('post', newSkip, limit);
    posts = await cachedPosts.length ? cachedPosts : await postService.getPosts({imgId: '$ne', gifUrl: '$ne'}, skip, limit, { createdAt: -1 });
    res.status(HTTP_STATUS.OK).json({ message: 'All posts with images', posts });
  }

  public async postsWithVideos(req: Request, res: Response): Promise<void> {
    const { page } = req.params;
    const skip = (parseInt(page) - 1) * PAGE_SIZE;
    const limit = PAGE_SIZE * parseInt(page);
    const newSkip = skip === 0? skip : skip + 1;
    let posts: IPostDocument[] = [];
    const cachedPosts: IPostDocument[] = await postCache.getPostsWithVieosFromCache('post', newSkip, limit);
    posts = await cachedPosts.length ? cachedPosts : await postService.getPosts({videoId: '$ne'}, skip, limit, { createdAt: -1 });
    res.status(HTTP_STATUS.OK).json({ message: 'All posts with images', posts });
  }
}

const { AuthenticationError } = require('apollo-server');
const Post = require('../../models/Post');
const checkAuth = require('../../util/checkAuth');

module.exports = {
    Query: {
        getPosts: async () => {
            try {
                const posts = await Post.find().sort({ createdAt: -1 });
                return posts;
            } catch (e) {
                throw new Error(e);
            }
        },
        getPost: async (_, { postId }) => {
            try {
                const post = await Post.findById(postId);

                if (post) {
                    return post;
                } else {
                    throw new Error('Post not found');
                }
            } catch (e) {
                throw new Error(e);
            }
        },
    },
    Mutation: {
        createPost: async (_, { body }, context) => {
            const user = checkAuth(context);

            if (args.body.trim() === '') {
                throw new Error('Post body must not be empty');
            }

            const newPost = new Post({
                body,
                user: user.id,
                username: user.username,
                createdAt: new Date().toISOString(),
            });

            const post = await newPost.save();

            context.pubSub.publish('NEW_POST', {
                newPost: post,
            });

            return post;
        },
        deletePost: async (_, { postId }, context) => {
            const user = checkAuth(context);

            try {
                const post = await Post.findById(postId);
                if (user.username === post.username) {
                    await post.delete();
                    return 'Post deleted successfully';
                } else {
                    throw new AuthenticationError('Action not allowed');
                }
            } catch (e) {
                throw new Error(e);
            }
        },
        likePost: async (_, { postId }, context) => {
            const { username } = checkAuth(context);

            const post = await Post.findById(postId);
            if (post) {
                if (post.likes.find((like) => like.username === username)) {
                    post.likes = post.likes.filter(
                        (like) => like.username !== username
                    );
                } else {
                    post.likes.push({
                        username,
                        createdAt: new Date().toISOString(),
                    });
                }

                await post.save();
                return post;
            } else {
                throw new UserInputError('Post not found');
            }
        },
    },
    Subscription: {
        newPost: {
            subscribe: (_, __, { pubSub }) => pubSub.asyncIterator('NEW_POST'),
        },
    },
};

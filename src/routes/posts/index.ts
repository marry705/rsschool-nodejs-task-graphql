import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import { ErrorMessages } from '../../utils/response';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
	fastify
): Promise<void> => {
	fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
		return reply.send(fastify.db.posts.findMany());
	});

	fastify.get(
		'/:id',
		{
			schema: {
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<PostEntity> {
			const post = await fastify.db.posts.findOne({
				key: 'id',
				equals: request.params.id,
			});

			if (!post) {
				return reply.code(404).send({ message: ErrorMessages.POST_ERROR });
			}

			return reply.send(post);
		}
	);

	fastify.post(
		'/',
		{
			schema: {
				body: createPostBodySchema,
			},
		},
		async function (request, reply): Promise<PostEntity> {
			const user = await fastify.db.users.findOne({
				key: 'id',
				equals: request.body.userId,
			});

			if (!user) {
				return reply.status(404).send({ message: ErrorMessages.USER_ERROR });
			}

			const newPost = await fastify.db.posts.create(request.body);

			return reply.send(newPost);
		}
	);

	fastify.delete(
		'/:id',
		{
			schema: {
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<PostEntity> {
			try {
				const deletePost = await fastify.db.posts.delete(request.params.id);

				return reply.send(deletePost);
			} catch (error) {
				return reply.code(400).send({ message: (error as Error).message });
			}
		}
	);

	fastify.patch(
		'/:id',
		{
			schema: {
				body: changePostBodySchema,
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<PostEntity> {
			try {
				const updatedPost = await fastify.db.posts.change(
					request.params.id,
					request.body
				);

				return reply.send(updatedPost);
			} catch (error) {
				return reply.code(400).send({ message: (error as Error).message });
			}
		}
	);
};

export default plugin;

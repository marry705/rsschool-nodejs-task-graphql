import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
	createUserBodySchema,
	changeUserBodySchema,
	subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { ErrorMessages } from '../../utils/response';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
	fastify
): Promise<void> => {
	fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
		return reply.send(fastify.db.users.findMany());
	});

	fastify.get(
		'/:id',
		{
			schema: {
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<UserEntity> {
			const user = await fastify.db.users.findOne({
				key: 'id',
				equals: request.params.id,
			});

			if (!user) {
				return reply.code(404).send({ message: ErrorMessages.USER_ERROR });
			}

			return reply.send(user);
		}
	);

	fastify.post(
		'/',
		{
			schema: {
				body: createUserBodySchema,
			},
		},
		async function (request, reply): Promise<UserEntity> {
			const newUser = await fastify.db.users.create(request.body);

			return reply.status(201).send(newUser);
		}
	);

	fastify.delete(
		'/:id',
		{
			schema: {
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<UserEntity> {
			try {
				const deletedUser = await fastify.db.users.delete(request.params.id);

				const followers = await fastify.db.users.findMany({
					key: 'subscribedToUserIds',
					equals: [deletedUser.id],
				});

				const posts = await fastify.db.posts.findMany({
					key: 'userId',
					equals: deletedUser.id,
				});

				const profile = await fastify.db.profiles.findOne({
					key: 'userId',
					equals: deletedUser.id,
				});

				if (profile) {
					await fastify.db.profiles.delete(profile.id);
				}

				posts.forEach(async (post) => await fastify.db.posts.delete(post.id));

				followers.forEach(
					async (follower) =>
						await fastify.db.users.change(follower.id, {
							subscribedToUserIds: follower.subscribedToUserIds.filter(
								(followerId) => followerId !== deletedUser.id
							),
						})
				);

				return reply.send(deletedUser);
			} catch (error) {
				return reply.status(400).send({ message: (error as Error).message });
			}
		}
	);

	fastify.post(
		'/:id/subscribeTo',
		{
			schema: {
				body: subscribeBodySchema,
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<UserEntity> {
			const subscriber = await fastify.db.users.findOne({
				key: 'id',
				equals: request.params.id,
			});

			const candidate = await fastify.db.users.findOne({
				key: 'id',
				equals: request.body.userId,
			});

			if (!subscriber || !candidate) {
				return reply.status(404).send({ message: ErrorMessages.NOT_FOUND });
			}
			const followerIndex = subscriber.subscribedToUserIds.findIndex(
				(follower) => follower === request.body.userId
			);

			if (followerIndex != -1) {
				return reply.status(400).send({ message: ErrorMessages.BAD_REQUEST });
			}

			const subscriberSubscribedToIds = [
				...subscriber.subscribedToUserIds,
				candidate.id,
			];

			const candidateSubscribedToUserIds = [
				...candidate.subscribedToUserIds,
				subscriber.id,
			];

			const updatedUser = await fastify.db.users.change(request.params.id, {
				subscribedToUserIds: subscriberSubscribedToIds,
			});

			await fastify.db.users.change(request.body.userId, {
				subscribedToUserIds: candidateSubscribedToUserIds,
			});

			return reply.status(200).send(updatedUser);
		}
	);

	fastify.post(
		'/:id/unsubscribeFrom',
		{
			schema: {
				body: subscribeBodySchema,
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<UserEntity> {
			const unSubscriber = await fastify.db.users.findOne({
				key: 'id',
				equals: request.params.id,
			});

			const candidate = await fastify.db.users.findOne({
				key: 'id',
				equals: request.body.userId,
			});

			if (!unSubscriber || !candidate) {
				return reply.status(404).send({ message: ErrorMessages.NOT_FOUND });
			}

			const followerIndex = unSubscriber.subscribedToUserIds.findIndex(
				(follower) => follower === request.body.userId
			);

			const subscriberIndex = candidate.subscribedToUserIds.findIndex(
				(subscriber) => subscriber === request.params.id
			);

			if (followerIndex === -1 || subscriberIndex === -1) {
				return reply.status(400).send({ message: ErrorMessages.BAD_REQUEST });
			}

			const updatedUser = await fastify.db.users.change(request.params.id, {
				subscribedToUserIds: unSubscriber.subscribedToUserIds.filter(
					(follower) => follower != request.body.userId
				),
			});

			await fastify.db.users.change(request.body.userId, {
				subscribedToUserIds: candidate.subscribedToUserIds.filter(
					(subscriber) => subscriber != request.params.id
				),
			});

			return reply.send(updatedUser);
		}
	);

	fastify.patch(
		'/:id',
		{
			schema: {
				body: changeUserBodySchema,
				params: idParamSchema,
			},
		},
		async function (request, reply): Promise<UserEntity> {
			try {
				const updatedUser = await fastify.db.users.change(
					request.params.id,
					request.body
				);

				return reply.send(updatedUser);
			} catch (error) {
				return reply.status(400).send({ message: (error as Error).message });
			}
		}
	);
};

export default plugin;

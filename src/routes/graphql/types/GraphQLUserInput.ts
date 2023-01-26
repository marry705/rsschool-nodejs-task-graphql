import { GraphQLID, GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from "graphql";

export const CreateUserDtoInput = new GraphQLInputObjectType({
	name: 'CreateUserDtoInput',
	fields: {
		firstName: { type: new GraphQLNonNull(GraphQLString) },
		lastName: { type: new GraphQLNonNull(GraphQLString) },
		email: { type: new GraphQLNonNull(GraphQLString) },
	},
});

export const UpdateUserDtoInput = new GraphQLInputObjectType({
	name: 'UpdateUserDtoInput',
	fields: {
		id: { type: new GraphQLNonNull(GraphQLID) },
		firstName: { type: GraphQLString },
		lastName: { type: GraphQLString },
		email: { type: GraphQLString },
	},
});
import Amplify, { API, graphqlOperation } from 'aws-amplify';
import { createTodo, updateTodo, deleteTodo } from './graphql/mutations';
import { getTodo, listTodos } from './graphql/queries';
import awsconfig from './aws-exports';
Amplify.configure(awsconfig);
const { program } = require('commander');
const inquirer = require('inquirer');

(async () => {
    /**
     * query api for todo by name
     */
    async function getTodoByName() {
        const answer = await inquirer.prompt([
            {name: 'title', message: 'Enter a title: '},
        ]);
        const searchTerm = answer.title;
        // fetch list and search by title
        try {
            const { data: { listTodos : { items } } } = await API.graphql(graphqlOperation(listTodos, {filter: {name: {eq: searchTerm}}}));
            const result = items[0];

            if (!result) {
                console.warn(`No Todo named ${searchTerm}`);
            }
            return result;
        } catch (err) {
            console.log("filter operation failed", err);
        }
        return null;
    }

    program
        .description('Todo list with AWS Amplify GraphQL Demo')
        .option('-l, --list', 'list all todos')
        .option('-n, --new', 'new todo')
        .option('-u, --update', 'update todo')
        .option('-d, --delete', 'delete todo');

    program.parse();
    const options = program.opts();

    if (options.list) {
        const { data: { listTodos: { items } } } = await API.graphql(graphqlOperation(listTodos));
        console.log("All todos", items);
    } else if (options.new) {
        /* create a todo */
        const answers = await inquirer.prompt(
            [
                {name: 'title', message: 'Enter a title: '},
                {name: 'description', message: 'Enter a description: '}
            ])
        if (answers.title !== '' && answers.description !== '') {
            const todo = { name: answers.title, description: answers.description };
            await API.graphql(graphqlOperation(createTodo, {input: todo}));
        } else {
            console.log("Invalid input");
        }
    } else if (options.update) {
        const todo = await getTodoByName();
        if (todo) {
            console.log("updating todo");
            try {
                const answer = await inquirer.prompt([{name: 'description', message: 'Enter new description: '}]);
                await API.graphql(graphqlOperation(updateTodo, { input: { id: todo.id, description: answer.description } } ));
            } catch (err) {
                console.warn("GraphQL error", err);
            }
        }
    } else if (options.delete) {
        const todo = await getTodoByName();
        if (todo) {
            console.log("deleting todo");
            try {
                await API.graphql(graphqlOperation(deleteTodo, { input: { id: todo.id } }));
            } catch (err) {
                console.warn("GraphQL error", err);
            }
        }
    } else {
        program.showHelpAfterError();
    }

    //console.log("Unsubscribing...");
    //createSub.unsubscribe();
})();

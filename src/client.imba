import './directives/tip'
import './components/todo-item'

import {random} from './utils'

const state =
	todos: [
		{title: 'One'}
		{title: 'Two'}
		{title: 'Three'}
	]

tag app-root

	def mount
		imba.commit()

	def render
		<self>
			<h1> "Todos"
			<div> for item in state.todos
				<todo-item model=item>
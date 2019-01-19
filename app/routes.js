import CssBaseline from '@material-ui/core/CssBaseline';
import React from 'react';
import { Route, Switch } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import DisciplineEditorPage from './components/editor';


export default () => (
	<App>
		<CssBaseline/>
		<Switch>
			<Route exact path="/editor" component={DisciplineEditorPage}/>

			<Route path="/" component={HomePage}/>
			<Route component={HomePage}/>
		</Switch>
	</App>
)

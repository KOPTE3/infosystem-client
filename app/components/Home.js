import React, { Component } from "react";
import { Link } from "react-router-dom";
import styles from "./Home.css";


type Props = {};

export default class Home extends Component<Props> {
	props: Props;

	render () {
		return (
			<div>
				<div className={styles.container} data-tid="container">
					<h2>Программный комплекс проектирования и экспертизы основных профессиональных образовательных программ</h2>
					<Link to="/editor">Редактировать учебную программу и тематический план</Link>
				</div>
			</div>
		);
	}
}

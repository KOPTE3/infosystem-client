import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import ArrowBack from '@material-ui/icons/ArrowBack';
import promiseIpc from 'electron-promise-ipc';
import React, { Component } from 'react';
import scheme from '../../scheme';
import styles from './editor.scss';


const disciplineStructure = {
	type: 'object',
	ordered_fields: [
		'name',
		'code',
		'cipher',
		'direction',
		'specialty',
		'part_type',
		'objective',
		'justification_for_inclusion',
		'competencies',
		'structure',
		'sections',
	],
	fields: {
		name: {
			type: 'string',
			description: 'Название дисциплины',
			example: 'Философско-политологические и исторические аспекты военного управления',
			external: true,
		},
		code: {
			type: 'string',
			description: 'Индекс дисциплины',
			example: 'ОНД.01',
			external: true,
		},
		cipher: {
			type: 'string',
			description: 'Шифр дисциплины',
			example: 'ДМ-141',
			external: true,
		},
		direction: {
			type: 'object',
			description: 'Направление подготовки',
			fields: {
				name: {
					type: 'string',
					description: 'Название направления подготовки',
					example: 'Управление воинскими частями и соединениями',
				},
				code: {
					type: 'string',
					description: 'Индекс направления подготовки',
					example: '56.04.02',
				},
				qualification: {
					type: 'string',
					description: 'Квалификация',
					example: 'магистр',
				},
				complexity: {
					type: 'number',
					description: 'Сложность',
					example: 2.0,
				},
			},
			external: true,
		},
		specialty: {
			type: 'object',
			description: 'Специальность',
			fields: {
				name: {
					type: 'string',
					description: 'Название специальности',
					example: 'Управление воинскими частями и соединениями ПВО',
				},
			},
			external: true,
		},
		part_type: {
			type: 'choice',
			description: 'Тип дисциплины',
			choices: [ 'basic', 'variative' ],
			example: 'basic',
		},
		objective: {
			type: 'string',
			description: 'Цель дисциплины',
			example: 'формирование систематизированных знаний о проблемах военного управления',
		},
		justification_for_inclusion: {
			type: 'string',
			description: 'Необходимость изучения учебной дисциплины',
			example: 'тем, что дисциплина формирует у обучающихся фундаментальные теоретические знания',
		},
		competencies: {
			type: 'array',
			description: 'Компетенции',
			values_type: 'object',
			values_fields: {
				code: {
					type: 'string',
					description: 'Индекс компетенции',
					example: 'ОК-1',
				},
				description: {
					type: 'string',
					description: 'Описание компетенции',
					example: 'Готовность действовать в нестандартных ситуациях',
				},
				know: {
					type: 'array',
					description: 'Знать',
					values_type: 'string',
				},
				able_to: {
					type: 'array',
					description: 'Уметь',
					values_type: 'string',
				},
				own: {
					type: 'array',
					description: 'Владеть',
					values_type: 'string',
				},
			},
			external: true,
		},
		structure: {
			type: 'object',
			description: 'Структура',
			fields: {
				semesters: {
					type: 'array',
					description: 'В каких семестрах изучается',
					values_type: 'number',
					example: [ 1, 2 ],
				},
				introduction: { // введение
					type: 'object',
					description: 'Введение',
					fields: {
						description: {type: 'string', description: 'Описание'},
						teacher_time: {
							type: 'object',
							description: 'Распределение учебного времени по работе с преподавателем',
							fields: {
								lectures: { type: 'number', description: 'лекции' },
								seminars: { type: 'number', description: 'семинары' },
								laboratory_works: { type: 'number', description: 'лабораторные работы' },
								practical_lessons: { type: 'number', description: 'практические занятия' },
								group_exercises: { type: 'number', description: 'групповые упражнения' },
								group_lessons: { type: 'number', description: 'групповые занятия' },
								tactical_exercises: {
									type: 'number',
									description: 'тактические и тактико-специальные занятия и учения',
								},
								military_games: {
									type: 'number',
									description: 'кшу, военные (военно-специальные) игры',
								},
								tests: { type: 'number', description: 'контрольные работы' },
								coursework: { type: 'number', description: 'курсовые работы (проекты, задачи)' },
								independent_work: {
									type: 'number',
									description: 'самостоятельная работа под руководством преподавателя',
								},
								exams: { type: 'number', description: 'экзамен, зачеты' },
							},

						},
						self_time: {
							type: 'object',
							description: 'Распределение учебного времени для самостоятельной работы',
							fields: {
								independent_work: {
									type: 'number',
									description: 'время, отводимое на самостоятельную работу',
								},
							},
						},
					},
				},
				conclusion: { // заключение
					type: 'object',
					description: 'Заключение',
					fields: {
						description: {type: 'string', description: 'Описание'},
						teacher_time: {
							type: 'object',
							description: 'Распределение учебного времени по работе с преподавателем',
							fields: {
								lectures: { type: 'number', description: 'лекции' },
								seminars: { type: 'number', description: 'семинары' },
								laboratory_works: { type: 'number', description: 'лабораторные работы' },
								practical_lessons: { type: 'number', description: 'практические занятия' },
								group_exercises: { type: 'number', description: 'групповые упражнения' },
								group_lessons: { type: 'number', description: 'групповые занятия' },
								tactical_exercises: {
									type: 'number',
									description: 'тактические и тактико-специальные занятия и учения',
								},
								military_games: {
									type: 'number',
									description: 'кшу, военные (военно-специальные) игры',
								},
								tests: { type: 'number', description: 'контрольные работы' },
								coursework: { type: 'number', description: 'курсовые работы (проекты, задачи)' },
								independent_work: {
									type: 'number',
									description: 'самостоятельная работа под руководством преподавателя',
								},
								exams: { type: 'number', description: 'экзамен, зачеты' },
							},

						},
						self_time: {
							type: 'object',
							description: 'Распределение учебного времени для самостоятельной работы',
							fields: {
								independent_work: {
									type: 'number',
									description: 'время, отводимое на самостоятельную работу',
								},
							},
						},
					},
				},
				sections: {
					type: 'array',
					description: 'разделы',
					values_type: 'object',
					values_fields: {
						order: { type: 'number', description: 'Порядок' },
						description: { type: 'string', description: 'Описание' },
						semester: { type: 'number', description: 'Семестр' },
					},
				},
				topics: {
					type: 'array',
					description: 'Темы',
					values_type: 'object',
					values_fields: {
						order: { type: 'number', description: 'Порядок' },
						description: { type: 'string', description: 'Описание' },
						section: { type: 'number', description: 'Раздел' },
						didactic_units: { type: 'string', description: 'Дидактические единицы' },
						teacher_time: {
							type: 'object',
							description: 'Распределение учебного времени по работе с преподавателем',
							fields: {
								lectures: { type: 'number', description: 'лекции' },
								seminars: { type: 'number', description: 'семинары' },
								laboratory_works: { type: 'number', description: 'лабораторные работы' },
								practical_lessons: { type: 'number', description: 'практические занятия' },
								group_exercises: { type: 'number', description: 'групповые упражнения' },
								group_lessons: { type: 'number', description: 'групповые занятия' },
								tactical_exercises: {
									type: 'number',
									description: 'тактические и тактико-специальные занятия и учения',
								},
								military_games: {
									type: 'number',
									description: 'кшу, военные (военно-специальные) игры',
								},
								tests: { type: 'number', description: 'контрольные работы' },
								coursework: { type: 'number', description: 'курсовые работы (проекты, задачи)' },
								independent_work: {
									type: 'number',
									description: 'самостоятельная работа под руководством преподавателя',
								},
								exams: { type: 'number', description: 'экзамен, зачеты' },
							},

						},
						self_time: {
							type: 'object',
							description: 'Распределение учебного времени для самостоятельной работы',
							fields: {
								independent_work: {
									type: 'number',
									description: 'время, отводимое на самостоятельную работу',
								},
							},
						},
					},
				},
				exams: {
					type: 'array',
					description: 'Экзамены',
					values_type: 'object',
					values_fields: {
						semester: { type: 'number', description: 'Семестр' },
						type: { type: 'choice', choices: [ 'credit', 'credit_with_mark', 'exam' ], description: 'Тип' },
						teacher_time: {
							type: 'object',
							description: 'Распределение учебного времени по работе с преподавателем',
							fields: {
								lectures: { type: 'number', description: 'лекции' },
								seminars: { type: 'number', description: 'семинары' },
								laboratory_works: { type: 'number', description: 'лабораторные работы' },
								practical_lessons: { type: 'number', description: 'практические занятия' },
								group_exercises: { type: 'number', description: 'групповые упражнения' },
								group_lessons: { type: 'number', description: 'групповые занятия' },
								tactical_exercises: {
									type: 'number',
									description: 'тактические и тактико-специальные занятия и учения',
								},
								military_games: {
									type: 'number',
									description: 'кшу, военные (военно-специальные) игры',
								},
								tests: { type: 'number', description: 'контрольные работы' },
								coursework: { type: 'number', description: 'курсовые работы (проекты, задачи)' },
								independent_work: {
									type: 'number',
									description: 'самостоятельная работа под руководством преподавателя',
								},
								exams: { type: 'number', description: 'экзамен, зачеты' },
							},

						},
						self_time: {
							type: 'object',
							description: 'Распределение учебного времени для самостоятельной работы',
							fields: {
								independent_work: {
									type: 'number',
									description: 'время, отводимое на самостоятельную работу',
								},
							},
						},
					},
				},
			},

		},
		sections: {
			type: 'object',
			description: 'Секции',
			fields: {
				'4_1': { type: 'wysiwyg' },
				'4_2': { type: 'wysiwyg' },
				'4_3': { type: 'wysiwyg' },
				'5': { type: 'wysiwyg' },
				'6': { type: 'wysiwyg' },
				'7': { type: 'wysiwyg' },
				'8_1': { type: 'wysiwyg' },
				'8_1_1': { type: 'wysiwyg' },
				'8_1_2': { type: 'wysiwyg' },
				'8_2': { type: 'wysiwyg' },
				'8_2_1': { type: 'wysiwyg' },
				'8_2_2': { type: 'wysiwyg' },
			},
		},
	},
};

type Props = {};

const errorsTexts = {
	required: 'Заполните обязательное поле',
};

export default class DisciplineEditorPage extends Component<Props> {
	props: Props;
	handleChange = name => event => {
		this.setState({
			formdata: {
				...this.state.formdata,
				[ name ]: event.target.value,
			},
		});
	};

	constructor (props) {
		super(props);

		const mode = 'edit', id = null;
		// if (this.props.match.path !== '/directions/add') {
		// 	mode = 'edit';
		// 	id = this.props.match.params.dir_id;
		// }

		this.state = {
			loading: mode === 'edit',
			direction: null,
			formdata: {},
			errors: {},
			mode,
			id,
			disabled: false,
		};

		this.onSubmit = this.onSubmit.bind(this);
	}

	async loadData (_id) {
		// TODO get data from file here
		// const directions = await promiseIpc.send('query-directions', { _id });
		// if (!directions) {
		// 	throw new Error('directions.length === 0');
		// }
		this.setState({
			loading: false,
			formdata: {},
		});
	}

	componentDidMount () {
		const { mode, id } = this.state;
		if (mode === 'edit') {
			this.loadData(id)
				.catch(console.error);
		}
	}

	async onSubmit (evt) {
		evt.preventDefault();

		// const { errors, data, invalid } = this.validate();
		// console.log({ errors, data, invalid });
		// if (invalid) {
		// 	this.setState({ errors });
		// 	return;
		// }

		this.setState({ errors: {}, disabled: true });

		discipline = {};
		Object.keys(this.state.formdata).forEach(function(field) {
			field.split('.')
		});

		const saveResult = await promiseIpc.send('save-direction', data);
		console.log('saved', { saveResult });

		if (data._id) {
			this.props.history.push(`/directions/${data._id}`);
			return;
		}
		this.props.history.push('/directions');
	}

	getBar () {
		const { mode, direction } = this.state;
		let header = '';
		header = <React.Fragment>Редактирование дисциплины</React.Fragment>;

		return (
			<AppBar position="static">
				<Toolbar>
					<Typography variant="title" color="inherit">
						<IconButton onClick={() => this.props.history.goBack()}>
							<ArrowBack/>
						</IconButton>
						{header}
					</Typography>
				</Toolbar>
			</AppBar>
		);
	}

	handleField (obj, name, res, error, uniqName) {
		if (obj.type === 'string' || obj.type === 'number') {
			res.push(
				<TextField
					type={obj.type}
					error={!!error}
					helperText={errorsTexts[ error ]}
					id={uniqName}
					key={uniqName}
					label={obj.description}
					InputLabelProps={{
						shrink: true,
					}}
					value={this.state.formdata[ uniqName ]}
					fullWidth
					margin="normal"
					onChange={this.handleChange(uniqName)}
				/>,
			);
		}

		if (obj.type === 'object') {
			if (obj.description) {
				res.push(
					<Typography variant="headline">{obj.description}</Typography>,
				);
			}
			Object.keys(obj.fields).forEach(function(fieldName) {
				this.handleField(obj.fields[ fieldName ], fieldName, res, error, uniqName + '.' + fieldName);
			}.bind(this));
		}

		if (obj.type === 'array') {
			res.push(
				<div>
					<Typography variant="headline">Список {obj.description}</Typography>
					<Button onClick={
						() => {
							if (obj.length) {
								obj.length += 1;
							} else {
								obj.length = 1;
							}
							this.forceUpdate();
						}
					}>+</Button>
				</div>,
			);
			for (let i = 1; i <= obj.length; i += 1) {
				res.push(
					<Typography variant="subheading">{i}</Typography>
				);
				if (obj.values_type === 'string' || obj.values_type === 'number') {
					res.push(
						<TextField
							type={obj.values_type}
							error={!!error}
							helperText={errorsTexts[ error ]}
							id={uniqName + `.${i}`}
							key={uniqName + `.${i}`}
							InputLabelProps={{
								shrink: true,
							}}
							value={this.state.formdata[ uniqName + `.${i}` ]}
							fullWidth
							margin="normal"
							onChange={this.handleChange(uniqName + `.${i}`)}
						/>,
					);
				}
				if (obj.values_type === 'object') {
					this.handleField({ type: 'object', fields: obj.values_fields }, name, res, error, uniqName + `.${i}`);
				}
			}
		}
	}

	fields () {
		const result = [];

		disciplineStructure.ordered_fields.forEach(function(name) {
			const error = this.state.errors[ name ];

			this.handleField(disciplineStructure.fields[ name ], name, result, error, name);

		}.bind(this));

		return result;
	}

	getContent () {
		const { disabled } = this.state;
		return (
			<div className={[ styles.contentWrapper, styles.contentWrapperMargin ].join(' ')}>
				<Paper classes={{ root: styles.content }}>
					<form onSubmit={this.onSubmit}>
						<Typography variant="headline">Заполните данные формы</Typography>
						{this.fields()}

						<Button variant="contained" color="primary" type="submit" disabled={!!disabled}>
							Сохранить
						</Button>
					</form>
				</Paper>
			</div>
		);
	}

	render () {
		const { loading } = this.state;
		if (loading) {
			return (
				<div>
					{this.getBar()}
					<div className={styles.progressWrapper}>
						<div className={styles.progress}>
							<CircularProgress color="white"/>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div>
				{this.getBar()}
				{this.getContent()}
			</div>
		);
	}
}


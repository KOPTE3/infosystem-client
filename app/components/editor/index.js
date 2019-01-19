import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import List from '@material-ui/core/List';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import ArrowBack from '@material-ui/icons/ArrowBack';
import CloseIcon from '@material-ui/icons/Close';
import SaveIcon from '@material-ui/icons/Save';
import PrintIcon from '@material-ui/icons/Print';
import promiseIpc from 'electron-promise-ipc';
import 'froala-editor/js/froala_editor.pkgd.min';
import 'froala-editor/js/languages/ru';
import React, { Component } from 'react';
import FroalaEditor from 'react-froala-wysiwyg';
import ReactTable from 'react-table';
import { kp, lessonTypes } from '../../store/common';
import styles from './editor.scss';
import { skillTypeMap, wisywigSections } from './store';


function HeaderCell (title, short) {
	return () => (
		<Tooltip title={title} placement="bottom">
			<span className={styles.headerCell}>{short || title}</span>
		</Tooltip>
	);
}

/**
 * @typedef {{all: number, teacher_time: {all: number, lectures: number, seminars: number, laboratory_works: number, practical_lessons: number, group_exercises: number, group_lessons: number, tactical_exercises: number, military_games: number, tests: number, coursework: number, courseworkpractice: number, independent_work: number, exams: number}, self_time: {all: number, independent_work: number}}} TimeBudget
 */

/**
 * @return {TimeBudget}
 */
function makeTimeBudget () {
	return {
		all: 0,
		teacher_time: {
			all: 0,
			lectures: 0, // лекции
			seminars: 0, // семинары
			laboratory_works: 0, // лабораторные работы
			practical_lessons: 0, // практические занятия
			group_exercises: 0, // групповые упражнения
			group_lessons: 0, // групповые занятия
			tactical_exercises: 0, // тактические и тактико-специальные занятия и учения
			military_games: 0, // кшу, военные (военно-специальные) игры
			tests: 0, // контрольные работы
			coursework: 0, // курсовые работы (проекты, задачи)
			independent_work: 0, // самостоятельная работа под руководством преподавателя
			exams: 0, // экзамен, зачеты
		},
		self_time: {
			all: 0,
			independent_work: 0, // время, отводимое на самостоятельную работу
		},
	};
}

const testTypes = Object.assign({}, lessonTypes, { kp });
Object.keys(testTypes).forEach(key => {
	if (testTypes[ key ].hidden) {
		delete testTypes[ key ];
	}
});

export default class DisciplineEditorPage extends Component {
	constructor (props) {
		super(props);


		this.state = {
			loading: true,
			source: null,
			results: {},
		};

		this.config = {
			placeholderText: 'Введите содержимое раздела, или скопируйте и вставьте из MS Word',
			language: 'ru',
			charCounterCount: false,
			toolbarButtons: [
				'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', '|', 'formatOL', 'formatUL', 'outdent', 'indent', '-', 'insertLink', 'insertTable', 'specialCharacters', '|', 'selectAll', 'clearFormatting', 'print', 'help', '|', 'undo', 'redo', 'fullscreen',
			],
			height: 300,
			heightMax: 600,
			wordPasteModal: false,
			wordDeniedAttrs: [ 'style', 'width' ],
			tableEditButtons: [ 'tableHeader', 'tableRows', 'tableColumns', 'tableCells', 'tableCellVerticalAlign', 'tableCellHorizontalAlign', '|', 'tableRemove' ],
			linkEditButtons: [ 'linkOpen', 'linkEdit', 'linkRemove' ],
		};

		this.onSubmit = this.onSubmit.bind(this);
		this.onPreview = this.onPreview.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.addCompetencySkill = this.addCompetencySkill.bind(this);
		this.addLesson = this.addLesson.bind(this);
	}

	componentDidMount () {
		this.loadData()
			.catch(console.error);
	}

	async loadData () {
		const source = await promiseIpc.send('load-source-data');
		if (!source) {
			this.props.history.push('/');
			return;
		}

		const prepared = this.prepareResults(source);

		this.setState({
			loading: false,
			source: prepared,
			results: prepared,
		});
	}

	prepareResults (source) {
		const { competencies, semesters } = source.constraints;
		const prepared = Object.assign({}, source);

		prepared.introText = prepared.introText || this.generateIntroTextTemplate(source, source);

		prepared.competencies = competencies || [];

		prepared.structure = prepared.structure || {
			introduction: {
				description: '',
			},
			conclusion: {
				description: '',
			},
			sections: [],
			topics: [],
			lessons: [],
			exams: semesters
				.map(s => {
					if (!s.exam) {
						return null;
					}
					const exam = {
						semester: s.number,
						type: s.exam,
						teacher_time: 0,
						self_time: 0,
					};
					if (typeof s.exam_time === 'number' && s.exam_time > 0) {
						exam.teacher_time = 9;
						exam.self_time = (s.exam_time - 1) * 9;
						exam.disabled = true;
					}

					return exam;
				})
				.filter(item => !!item),
		};

		prepared.sections = prepared.sections || {};

		[ '4_1', '4_2', '4_3', '5', '6', '7', '8_1', '8_1_1', '8_1_2', '8_2', '8_2_1', '8_2_2' ].forEach((section) => {
			prepared.sections[ section ] = prepared.sections[ section ] || '';
		});

		return prepared;
	}

	generateIntroTextTemplate (results, source) {
		const partTypeMap = {
			basic: 'базовой',
			variative: 'вариативной',
			practice: 'практической',
		};

		const div = document.createElement('div');
		div.innerHTML = `
		<p>Дисциплина &laquo;<span data-id="name"></span>&raquo; реализуется в рамках <span data-id="part_type"></span> части основной профессиональной образовательной программы (ОПОП).<br/></p>

		<p>Основной целью освоения учебной дисциплины является <em>... опишите цель освоения учебной дисциплины</em>.<br/></p>

		<p>Необходимость изучения учебной дисциплины в рамках основной профессиональной образовательной программы по направлению подготовки &mdash; <span data-id="direction.code"></span> &laquo;<span
			data-id="direction.name"></span>&raquo; по военной специальности &laquo;<span
			data-id="specialty.name"></span>&raquo; обусловлена <em>... даётся обоснование включения данной дисциплины в состав ОПОП</em>.<br/></p>
			
		<p>Эффективное освоение учебной дисциплины &laquo;<span data-id="name2"></span>&raquo; возможно на базе знаний, умений и навыков <em>... описываются предшествующие и последующие дисциплины</em>.<br/></p>
		
		<p>В результате освоения обучающимся данных дисциплин он должен:</p>

		<ul>
			<li>
				<strong>знать:</strong>
				<ul>
					<li>знать...</li>
				</ul>
			</li>
			<li>
				<strong>уметь:</strong>
				<ul>
					<li>уметь...</li>
				</ul>
			</li>
			<li>
				<strong>владеть:</strong>
				<ul>
					<li>владеть...</li>
				</ul>
			</li>
		</ul>
`;

		div.querySelector('[data-id="name"]').textContent = source.name;
		div.querySelector('[data-id="name2"]').textContent = source.name;
		div.querySelector('[data-id="part_type"]').textContent = partTypeMap[ source.part_type ];
		div.querySelector('[data-id="direction.code"]').textContent = source.direction.code;
		div.querySelector('[data-id="direction.name"]').textContent = source.direction.name;
		div.querySelector('[data-id="specialty.name"]').textContent = source.specialty.name;

		return div.innerHTML;
	}

	async onSubmit () {
		try {
			await promiseIpc.send('save-result-data', { ...this.state.source, ...this.state.results });
		} catch (e) {
			console.error(e);
		}
	}

	async onPreview () {
		try {
			await promiseIpc.send('preview-result-data', { ...this.state.source, ...this.state.results });
		} catch (e) {
			console.error(e);
		}
	}

	handleChange (callback) {
		return evt => {
			const { results } = this.state;
			const v = evt.target.value;
			const modified = callback(results, v);
			this.setState({
				results: Object.assign({}, modified),
			});
		};
	}

	handleChangeLesson (order, field) {
		return (evt) => {
			const { results } = this.state;
			let v = evt.target.value;

			if (field === 'teacher_time' || field === 'self_time') {
				v = parseFloat(v);
			}

			results.structure.lessons = this.recalcLessons(
				results.structure.lessons.map(l => {
					if (l.order === order) {
						l[ field ] = v;
					}

					return l;
				}),
			);

			this.setState({
				results: Object.assign({}, results),
			});
		};
	}

	addCompetencySkill (_id, type) {
		const { results } = this.state;
		results.competencies = results.competencies.map((c) => {
			if (c._id === _id) {
				c[ type ].push('');
			}

			return c;
		});

		this.setState({
			results: Object.assign({}, results),
		});
	}

	addLesson (topic) {
		const { results } = this.state;

		results.structure.lessons.push({
			order: results.structure.topics.length + 1,
			suborder: 0,
			topic, // or 'introduction', or 'conclusion'
			name: '',
			description: '',
			provision: '',
			literature: '',
			type: 'l', // тип занятия,
			teacher_time: 0,
			self_time: 0,
		});

		results.structure.lessons = this.recalcLessons(results.structure.lessons);

		this.setState({
			results: Object.assign({}, results),
		});
	}

	removeLesson (lesson) {
		const { results } = this.state;
		console.info('remove lesson', lesson);

		results.structure.lessons = this.recalcLessons(
			results.structure.lessons.filter(l => l.order !== lesson),
		);

		this.setState({
			results: Object.assign({}, results),
		});
	}

	recalcLessons (lessons) {
		const lmap = {};

		return lessons
			.sort((tl, tr) => {
				if (tl.topic === tr.topic) {
					return tl.order - tr.order;
				}

				if (tl.topic === 'introduction') {
					return -1;
				}

				if (tr.topic === 'introduction') {
					return +1;
				}

				if (tl.topic === 'conclusion') {
					return +1;
				}

				if (tr.topic === 'conclusion') {
					return -1;
				}

				return tl.section - tr.section;
			})
			.map((t, pos) => {
				t.order = pos + 1;
				lmap[ t.type ] = (lmap[ t.type ] | 0) + 1;
				t.suborder = lmap[ t.type ];
				return t;
			});
	}

	removeCompetencySkill (_id, type, pos) {
		const { results } = this.state;
		results.competencies = results.competencies.map((c) => {
			if (c._id === _id) {
				c[ type ].splice(pos, 1);
			}

			return c;
		});

		this.setState({
			results: Object.assign({}, results),
		});
	}

	editCompetenciesSkillsList (type, competency) {
		return (
			<React.Fragment>
				<Typography variant="body2">
					{skillTypeMap[ type ]}
					<Typography
						variant="button"
						component="a"
						classes={{ root: styles.addLinkButton }}
						onClick={() => this.addCompetencySkill(competency._id, type)}
					>Добавить элемент
					</Typography>
				</Typography>
				{
					competency[ type ].map((item, pos) => {
						const id = `${competency._id}_${type}_${pos}`;

						return (
							<Input
								id={id}
								key={id}
								value={item}
								onChange={this.handleChange((initial, value) => {
									const _c = initial.competencies.find(c => c.code === competency.code);
									_c[ type ][ pos ] = value;
									return initial;
								})}
								fullWidth
								endAdornment={
									<InputAdornment position="end">
										<IconButton
											onClick={() => this.removeCompetencySkill(competency._id, type, pos)}
										>
											<CloseIcon/>
										</IconButton>
									</InputAdornment>
								}
							/>
						);
					})
				}
			</React.Fragment>
		);
	}

	editCompetencies () {
		const { source, results } = this.state;

		return (
			<div>
				<Typography variant="headline">Информация о формируемых компетенциях</Typography>
				<Typography variant="subheading" gutterBottom>
					Необходимо заполнить перечень планируемых результатов обучения по
					категориям &quot;Знать&quot;, &quot;Уметь&quot;, &quot;Владеть&quot;
				</Typography>

				<List>
					{
						source.constraints.competencies.map(({ code, description }) => {
							const competency = results.competencies.find(c => c.code === code);

							return (
								<div id={competency._id} key={competency._id} style={{ margin: 12 }}>
									<Typography variant="title">{code}</Typography>
									<Typography variant="body1" color="textSecondary">{description}</Typography>
									{this.editCompetenciesSkillsList('know', competency)}
									{this.editCompetenciesSkillsList('able_to', competency)}
									{this.editCompetenciesSkillsList('own', competency)}
								</div>
							);
						})
					}
				</List>
				<hr/>
			</div>
		);
	}

	addSection (semester) {
		const { results } = this.state;

		results.structure.sections.push({
			order: results.structure.sections.length + 1,
			semester,
			description: '',
		});

		results.structure.sections = results.structure.sections
			.sort((sl, sr) => {
				if (sl.semester === sr.semester) {
					return sl.order - sr.order;
				}

				return sl.semester - sr.semester;
			})
			.map((s, pos) => {
				s.order = pos + 1;
				return s;
			});

		this.setState({
			results: Object.assign({}, results),
		});
	}

	removeSection (section) {
		const { results } = this.state;
		console.info('remove section', section);

		if (results.structure.topics.some(t => t.section === section)) {
			alert('Нельзя удалить раздел, в котором имеются темы');
			return;
		}

		results.structure.sections = results.structure.sections
			.filter(s => s.order !== section)
			.map((s, pos) => {
				results.structure.topics = results.structure.topics.map(t => {
					if (t.section === s.order) {
						t.new_section = pos + 1;
					}

					return t;
				});
				s.order = pos + 1;
				return s;
			});

		results.structure.topics = results.structure.topics.map(t => {
			t.section = t.new_section;
			delete t.new_section;

			return t;
		});

		this.setState({
			results: Object.assign({}, results),
		});
	}

	removeTopic (topic) {
		const { results } = this.state;
		console.info('remove topic', topic);

		results.structure.topics = results.structure.topics
			.filter(s => s.order !== topic)
			.map((t, pos) => {
				t.order = pos + 1;
				return t;
			});

		this.setState({
			results: Object.assign({}, results),
		});
	}

	addTopic (section) {
		const { results } = this.state;

		results.structure.topics.push({
			order: results.structure.topics.length + 1,
			description: '',
			didactic_units: '',
			section,
		});

		results.structure.topics = results.structure.topics
			.sort((tl, tr) => {
				if (tl.section === tr.section) {
					return tl.order - tr.order;
				}

				return tl.section - tr.section;
			})
			.map((t, pos) => {
				t.order = pos + 1;
				return t;
			});

		this.setState({
			results: Object.assign({}, results),
		});
	}

	topicEditor (topic) {
		const { source, results } = this.state;
		const lessons = results.structure.lessons
			.filter(l => l.topic === topic);

		return (
			<List>
				{
					lessons.map(({ order, suborder, name, description, type, provision, literature, teacher_time, self_time }) => {
						const id = `topic_${topic}_lesson_${order}`;
						const type_id = `${id}_type`;
						const teacher_time_id = `${id}_teacher_time`;
						const self_time_id = `${id}_self_time`;
						const name_id = `${id}_name`;
						const description_id = `${id}_description`;
						const provision_id = `${id}_provision`;
						const literature_id = `${id}_literature`;

						return (
							<div id={id} key={id}>
								<Typography variant="subheading" color="textSecondary">
									{lessonTypes[ type ].full} №{suborder}
									<Typography
										variant="button"
										component="a"
										classes={{ root: styles.addLinkButton }}
										onClick={() => this.removeLesson(order)}
									>Удалить</Typography>
								</Typography>
								<Paper className={styles.lessonPaper}>
									<Grid container spacing={8}>
										<Grid item xs={4}>
											<FormControl fullWidth margin="dense">
												<InputLabel htmlFor={type_id}>Вид занятия</InputLabel>
												<Select
													value={type}
													onChange={this.handleChangeLesson(order, 'type')}
													input={<Input name={type_id} id={type_id}/>}
												>
													{Object.keys(lessonTypes).map(t => {
														return (
															<MenuItem key={t}
															          value={t}>{lessonTypes[ t ].full}</MenuItem>
														);
													})}
												</Select>
												<FormHelperText>Выберите вид учебного занятия</FormHelperText>
											</FormControl>
										</Grid>
										<Grid item xs={4}>
											<TextField
												fullWidth
												id={teacher_time_id}
												type="number"
												label="Работа с преподавателем"
												value={teacher_time}
												onChange={this.handleChangeLesson(order, 'teacher_time')}
												margin="dense"
												helperText="Количество часов, отведённых на работу с преподавателем"
											/>
										</Grid>
										<Grid item xs={4}>
											<TextField
												fullWidth
												id={self_time_id}
												type="number"
												label="Самостоятельная работа"
												value={self_time}
												onChange={this.handleChangeLesson(order, 'self_time')}
												margin="dense"
												helperText="Количество часов, отведённых на самостоятельную работу"
											/>
										</Grid>
										<Grid item xs={12}>
											<TextField
												fullWidth
												id={name_id}
												label="Название занятия"
												value={name}
												onChange={this.handleChangeLesson(order, 'name')}
												helperText="Название (тема) занятия"
											/>
										</Grid>
										<Grid item xs={12}>
											<TextField
												fullWidth
												multiline
												rowsMax={4}
												id={description_id}
												label="Описание занятия"
												value={description}
												onChange={this.handleChangeLesson(order, 'description')}
												helperText="Описание (состав) занятия"
											/>
										</Grid>
										<Grid item xs={6}>
											<TextField
												fullWidth
												multiline
												rowsMax={4}
												id={provision_id}
												value={provision}
												onChange={this.handleChangeLesson(order, 'provision')}
												helperText="Материальное обеспечение занятия"
											/>
										</Grid>
										<Grid item xs={6}>
											<TextField
												fullWidth
												multiline
												rowsMax={4}
												id={literature_id}
												value={literature}
												onChange={this.handleChangeLesson(order, 'literature')}
												helperText="Литература для самостоятельной подготовки"
											/>
										</Grid>
									</Grid>
								</Paper>
							</div>
						);
					})
				}
			</List>
		);
	}

	sectionEditor (section) {
		const { source, results } = this.state;
		const topics = results.structure.topics
			.filter(t => t.section === section);

		return (
			<List>
				{
					topics.map(({ order, description, didactic_units, test }) => {
						const id = `section_${section}_topic_${order}`;
						return (
							<div id={id} key={id}>
								<Typography variant="title" color="textSecondary">
									Тема {order}
									<Typography
										variant="button"
										component="a"
										classes={{ root: styles.addLinkButton }}
										onClick={() => this.addLesson(order)}
									>Добавить учебное занятие</Typography>
									<Typography
										variant="button"
										component="a"
										classes={{ root: styles.addLinkButton }}
										onClick={() => this.removeTopic(order)}
									>Удалить тему
									</Typography>
								</Typography>

								<TextField
									fullWidth
									multiline
									id={`${id}-description`}
									label={`Название Темы ${order}`}
									rowsMax="2"
									value={description}
									onChange={this.handleChange((initial, value) => {
										initial.structure.topics = initial.structure.topics
											.map(s => {
												if (s.order === order) {
													s.description = value;
												}
												return s;
											});
										return initial;
									})}
									margin="normal"
								/>

								<TextField
									fullWidth
									multiline
									id={`${id}-didactic_units`}
									label={`Дидактические единицы Темы ${order}`}
									rowsMax="10"
									value={didactic_units}
									onChange={this.handleChange((initial, value) => {
										initial.structure.topics = initial.structure.topics
											.map(s => {
												if (s.order === order) {
													s.didactic_units = value;
												}
												return s;
											});
										return initial;
									})}
									margin="normal"
									helperText="Перечисляются все дидактические единицы, подлежащие изучению в ходе освоения темы"
								/>

								<Grid container spacing={8}>
									<Grid item xs={6}>
										<FormControl fullWidth margin="dense">
											<InputLabel htmlFor={`${id}_test_type`}>Вид контрольного
												мероприятия</InputLabel>
											<Select
												value={test ? test.type : ''}
												onChange={this.handleChange((initial, value) => {
													initial.structure.topics = initial.structure.topics
														.map(s => {
															if (s.order === order) {
																if (value) {
																	s.test = {
																		type: value,
																		time: 0,
																	};
																} else {
																	s.test = null;
																}
															}
															return s;
														});
													return initial;
												})}
												input={<Input name={`${id}_test_type`} id={`${id}_test_type`}/>}
											>
												<MenuItem key={''} value={''}><em>Нет</em></MenuItem>
												{Object.keys(testTypes).map(t => {
													return (
														<MenuItem key={t} value={t}>{testTypes[ t ].full}</MenuItem>
													);
												})}
											</Select>
										</FormControl>
									</Grid>
									{test && <Grid item xs={6}>
										<TextField
											fullWidth
											id={`${id}_test_time`}
											label="Продолжительность контроля"
											type="number"
											value={test.time}
											onChange={this.handleChange((initial, value) => {
												initial.structure.topics = initial.structure.topics
													.map(s => {
														if (s.order === order) {
															s.test.time = value;
														}
														return s;
													});
												return initial;
											})}
											margin="dense"
										/>
									</Grid>}
								</Grid>

								{this.topicEditor(order)}
							</div>
						);
					})
				}
			</List>
		);
	}

	semesterEditor (semester) {
		const { source, results } = this.state;
		const sections = results.structure.sections
			.filter(s => s.semester === semester);

		return (
			<List>
				{
					sections.map(({ order, description }) => {
						const id = `semester_${semester}_section_${order}`;
						return (
							<div id={id} key={id}>
								<Typography variant="headline" color="textSecondary">
									Раздел {order}
									<Typography
										variant="button"
										component="a"
										classes={{ root: styles.addLinkButton }}
										onClick={() => this.addTopic(order)}
									>Добавить тему
									</Typography>

									<Typography
										variant="button"
										component="a"
										classes={{ root: styles.addLinkButton }}
										onClick={() => this.removeSection(order)}
									>Удалить раздел
									</Typography>
								</Typography>

								<TextField
									fullWidth
									multiline
									id={`${id}-description`}
									label={`Название Раздела ${order}`}
									rowsMax="2"
									value={description}
									onChange={this.handleChange((initial, value) => {
										initial.structure.sections = initial.structure.sections
											.map(s => {
												if (s.order === order) {
													s.description = value;
												}
												return s;
											});
										return initial;
									})}
									margin="normal"
								/>

								{this.sectionEditor(order)}
							</div>
						);
					})
				}
			</List>
		);
	}

	semesterExamsEditor (semester) {
		const { source, results } = this.state;
		const semesterExam = results.structure.exams.find(({ semester: s }) => s === semester);

		if (!semesterExam) {
			return null;
		}
		const { type, teacher_time, self_time, disabled } = semesterExam;
		const id = `semester_${semester}_exam`;

		return (
			<div>
				<Typography variant="headline" color="textSecondary">{lessonTypes[ type ].full}</Typography>

				<Grid container spacing={8}>
					<Grid item xs={6}>
						<TextField
							fullWidth
							disabled={disabled}
							id={`${id}_teacher_time`}
							type="number"
							label="Работа с преподавателем"
							value={teacher_time}
							onChange={this.handleChange((initial, value) => {
								initial.structure.exams = initial.structure.exams
									.map(e => {
										if (e.semester === semester) {
											e.teacher_time = parseFloat(value);
										}
										return e;
									});
								return initial;
							})}
							margin="dense"
							helperText="Количество часов, отведённых на работу с преподавателем"
						/>
					</Grid>
					<Grid item xs={6}>
						<TextField
							fullWidth
							disabled={disabled}
							id={`${id}_self_time`}
							type="number"
							label="Самостоятельная работа"
							value={self_time}
							onChange={this.handleChange((initial, value) => {
								initial.structure.exams = initial.structure.exams
									.map(e => {
										if (e.semester === semester) {
											e.self_time = parseFloat(value);
										}
										return e;
									});
								return initial;
							})}
							margin="dense"
							helperText="Количество часов, отведённых на самостоятельную работу"
						/>
					</Grid>
				</Grid>
			</div>
		);

	}

	topicsStructureEditor () {
		const { source, results } = this.state;

		return (
			<List>
				{
					source.constraints.semesters.map(({ number }) => {
						const id = `semester_${number}`;
						return (
							<div id={id} key={id}>
								<Typography variant="display1">
									Семестр {number}
									<Typography
										variant="button"
										component="a"
										classes={{ root: styles.addLinkButton }}
										onClick={() => this.addSection(number)}
									>Добавить раздел
									</Typography>
								</Typography>
								{this.semesterEditor(number)}
								{this.semesterExamsEditor(number)}
							</div>
						);
					})
				}
			</List>
		);
	}

	editStructure () {
		const { source, results } = this.state;

		return (
			<div>
				<Typography variant="headline">Содержание разделов (тем) учебной дисциплины</Typography>
				<Typography variant="subheading" gutterBottom>
					Необходимо заполнить описание и порядок учебных разделов и тем
				</Typography>

				<Typography variant="title" color="textSecondary">
					Введение
					<Typography
						variant="button"
						component="a"
						classes={{ root: styles.addLinkButton }}
						onClick={() => this.addLesson('introduction')}
					>Добавить учебное занятие</Typography>
				</Typography>
				<TextField
					fullWidth
					multiline
					id="introduction-description"
					label="Заполните описание учебного раздела &quot;Введение&quot;"
					rowsMax="4"
					value={results.structure.introduction.description}
					onChange={this.handleChange((initial, value) => {
						initial.structure.introduction.description = value;
						return initial;
					})}
					margin="normal"
					helperText="Необязательное поле"
				/>
				{this.topicEditor('introduction')}
				<hr/>

				{this.topicsStructureEditor()}

				<hr/>

				<Typography variant="title" color="textSecondary">
					Заключение
					<Typography
						variant="button"
						component="a"
						classes={{ root: styles.addLinkButton }}
						onClick={() => this.addLesson('conclusion')}
					>Добавить учебное занятие</Typography>
				</Typography>
				<TextField
					fullWidth
					multiline
					id="conclusion-description"
					label="Заполните описание учебного раздела &quot;Заключение&quot;"
					rowsMax="4"
					value={results.structure.conclusion.description}
					onChange={this.handleChange((initial, value) => {
						initial.structure.conclusion.description = value;
						return initial;
					})}
					margin="normal"
					helperText="Необязательное поле"
				/>
				{this.topicEditor('conclusion')}
				<hr/>
			</div>
		);
	}

	handleWisywigChange (name) {
		return (model) => {
			const { results } = this.state;
			results.sections[ name ] = model;
			this.setState({
				results: Object.assign({}, results),
			});
		};
	}

	editWisywigSections () {
		const { source, results } = this.state;

		return (
			<div>
				<Typography variant="display2">Методическая часть учебной программы</Typography>

				<List>
					{Object.values(wisywigSections).map(({ id, description, helperText }) => {
						const _id = `wisywig-section-${id}`;
						return (
							<div id={_id} key={_id} style={{ marginBottom: 36 }}>
								<Typography variant="headline">{description}</Typography>
								<Typography variant="subheading" gutterBottom>{helperText}</Typography>
								<Typography variant="subheading" gutterBottom color="textSecondary">Введите содержимое
									раздела, или скопируйте и вставьте из MS Word</Typography>
								<FroalaEditor
									tag='textarea'
									config={this.config}
									model={results.sections[ id ]}
									onModelChange={this.handleWisywigChange(id)}
								/>
							</div>
						);
					})}
				</List>
				<hr/>
			</div>
		);
	}

	columns () {
		return [
			{
				Header: HeaderCell('Номера и наименование разделов и тем'),
				id: 'description',
				width: 150,
				accessor: d => d.description,
			},
			{
				Header: HeaderCell('Всего часов учебных занятий'),
				id: 'all',
				width: 50,
				accessor: d => d.all || '',
			},
			{
				Header: HeaderCell('В том числе учебных занятий с преподавателем'),
				id: 'teacher_time_all',
				width: 50,
				accessor: d => d.teacher_time.all || '',
			},
			{
				Header: 'Из них по видам учебных занятий',
				columns: [
					{
						Header: HeaderCell('лекции'),
						id: 'lectures',
						width: 50,
						accessor: d => d.teacher_time.lectures || '',
					},
					{
						Header: HeaderCell('семинары'),
						id: 'seminars',
						width: 50,
						accessor: d => d.teacher_time.seminars || '',
					},
					{
						Header: HeaderCell('лабораторные работы'),
						id: 'laboratory_works',
						width: 50,
						accessor: d => d.teacher_time.laboratory_works || '',
					},
					{
						Header: HeaderCell('практические занятия'),
						id: 'practical_lessons',
						width: 50,
						accessor: d => d.teacher_time.practical_lessons || '',
					},
					{
						Header: HeaderCell('групповые упражнения'),
						id: 'group_exercises',
						width: 50,
						accessor: d => d.teacher_time.group_exercises || '',
					},
					{
						Header: HeaderCell('групповые занятия'),
						id: 'group_lessons',
						width: 50,
						accessor: d => d.teacher_time.group_lessons || '',
					},
					{
						Header: HeaderCell('тактические и тактико-специальные занятия и учения'),
						id: 'tactical_exercises',
						width: 50,
						accessor: d => d.teacher_time.tactical_exercises || '',
					},
					{
						Header: HeaderCell('КШУ, военные, (военно-специальные) игры'),
						id: 'military_games',
						width: 50,
						accessor: d => d.teacher_time.military_games || '',
					},
					{
						Header: HeaderCell('контрольные работы'),
						id: 'tests',
						width: 50,
						accessor: d => d.teacher_time.tests || '',
					},
					{
						Header: HeaderCell('курсовые работы (проекты, задачи)'),
						id: 'coursework',
						width: 50,
						accessor: d => d.teacher_time.coursework || '',
					},
					{
						Header: HeaderCell('самостоятельная работа под руководством преподавателя'),
						id: 'independent_work',
						width: 50,
						accessor: d => d.teacher_time.independent_work || '',
					},
					{
						Header: HeaderCell('экзамен, зачеты'),
						id: 'exams',
						width: 50,
						accessor: d => d.teacher_time.exams || '',
					},
				],
			},
			{
				Header: HeaderCell('Время, отводимое на самостоятельную работу'),
				id: 'self_time_all',
				width: 50,
				accessor: d => d.self_time.all,
			},
		];
	}

	editTimeBudget () {
		const { source, results } = this.state;

		const b = makeTimeBudget();
		b.description = 'qwe';

		return (
			<div>
				<Typography variant="headline">Распределение учебного времени</Typography>
				<Typography variant="subheading" gutterBottom>
					Необходимо заполнить распределение учебного времени
				</Typography>

				<ReactTable
					data={[
						b,
					]}
					columns={this.columns()}
					sortable={false}
					multiSort={false}
					resizable={false}
					showPagination={false}
					showPaginationTop={false}
					showPaginationBottom={false}
					showPageSizeOptions={false}
					showPageJump={false}
					className="-highlight"
				/>
			</div>
		);
	}

	editIntroText () {
		const { source, results } = this.state;

		return (
			<div>
				<Typography variant="headline">Место и роль учебной дисциплины в структуре основной профессиональной
					образовательной программы подготовки {source.direction.qualification}а</Typography>
				<Typography variant="subheading" gutterBottom>Пункт I Учебной программы</Typography>
				<Typography variant="subheading" gutterBottom color="textSecondary">Отредактируйте содержимое
					раздела, или скопируйте и вставьте из MS Word</Typography>
				<FroalaEditor
					tag='textarea'
					config={this.config}
					model={results.introText}
					onModelChange={model => {
						const { results } = this.state;
						results.introText = model;
						this.setState({
							results: Object.assign({}, results),
						});
					}}
				/>
				<hr/>
			</div>
		);
	}

	fields () {
		const { source, results } = this.state;
		console.log({ source, results });

		return (
			<Paper classes={{ root: styles.content }}>
				{this.editIntroText()}
				{/*{this.editCompetencies()}*/}
				{this.editStructure()}
				{/* {this.editTimeBudget()} */}
				{this.editWisywigSections()}

				<Button variant="contained" onClick={this.onSubmit} color="primary">
					Сохранить
				</Button>

				<Button variant="contained" onClick={this.onPreview} color="secondary">
					Сохранить в PDF
				</Button>
			</Paper>
		);
	}

	getContent () {
		const { loading } = this.state;

		if (loading) {
			return (
				<div className={styles.progressWrapper}>
					<div className={styles.progress}>
						<CircularProgress color="white"/>
					</div>
				</div>
			);
		}

		const { source } = this.state;

		return (
			<div className={[ styles.contentWrapper, styles.contentWrapperMargin ].join(' ')}>
				<Typography variant="display1"
				            classes={{ root: styles.white }}>Дисциплина {source.name} (шифр {source.cipher})</Typography>
				{this.fields()}
			</div>
		);
	}

	getBar () {
		const { source } = this.state;
		let header = <React.Fragment>Редактирование дисциплины</React.Fragment>;
		if (source) {
			header = <React.Fragment>Редактирование дисциплины {source.code}</React.Fragment>;
		}

		return (
			<AppBar position="static">
				<Toolbar>
					<Typography variant="title" color="inherit">
						<IconButton onClick={() => this.props.history.push('/')}>
							<ArrowBack/>
						</IconButton>
						{header}
					</Typography>

					<Button onClick={this.onSubmit} mini variant="fab" color="white" classes={{ fab: styles.add }}>
						<SaveIcon/>
					</Button>

					<Button onClick={this.onPreview} mini variant="fab" color="white"
					        classes={{ fab: styles.addSmall }}>
						<PrintIcon/>
					</Button>
				</Toolbar>
			</AppBar>
		);
	}

	render () {
		return (
			<div>
				{this.getBar()}
				{this.getContent()}
			</div>
		);
	}
}

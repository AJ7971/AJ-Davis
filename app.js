// Version 1 - Basic localStorage-backed planner
const STORAGE_KEY = 'studyPlannerData_v1'

let state = { courses: [], assignments: [] }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6) }

function load() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) state = JSON.parse(raw)
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// Courses
const courseForm = document.getElementById('course-form')
const courseNameInput = document.getElementById('course-name')
const coursesList = document.getElementById('courses-list')

courseForm.addEventListener('submit', e => {
  e.preventDefault()
  const idField = document.getElementById('course-id')
  const name = courseNameInput.value.trim()
  if (!name) return
  if (idField.value) {
    const id = idField.value
    const c = state.courses.find(x => x.id === id)
    if (c) c.name = name
    idField.value = ''
    courseForm.querySelector('button').textContent = 'Add Course'
  } else {
    state.courses.push({ id: uid(), name })
  }
  courseNameInput.value = ''
  save(); renderCourses(); renderCourseOptions();
})

function renderCourses() {
  coursesList.innerHTML = ''
  state.courses.forEach(c => {
    const li = document.createElement('li'); li.className='item'
    const left = document.createElement('div')
    left.innerHTML = `<strong>${escapeHtml(c.name)}</strong><div class="meta">ID: ${c.id}</div>`
    const actions = document.createElement('div')
    actions.innerHTML = `<button data-id="${c.id}" class="edit">Edit</button> <button data-id="${c.id}" class="del">Delete</button>`
    li.appendChild(left); li.appendChild(actions)
    coursesList.appendChild(li)
  })
}

coursesList.addEventListener('click', e => {
  if (e.target.classList.contains('edit')) {
    const id = e.target.dataset.id
    const c = state.courses.find(x => x.id === id)
    if (c) {
      document.getElementById('course-id').value = c.id
      courseNameInput.value = c.name
      courseForm.querySelector('button').textContent = 'Save Course'
    }
  }
  if (e.target.classList.contains('del')) {
    const id = e.target.dataset.id
    state.courses = state.courses.filter(x => x.id !== id)
    // also remove course from assignments
    state.assignments = state.assignments.filter(a => a.courseId !== id)
    save(); renderCourses(); renderAssignments(); renderCourseOptions()
  }
})

// Assignments
const assignmentForm = document.getElementById('assignment-form')
const assignmentTitle = document.getElementById('assignment-title')
const assignmentCourse = document.getElementById('assignment-course')
const assignmentDue = document.getElementById('assignment-due')
const assignmentPriority = document.getElementById('assignment-priority')
const assignmentStatus = document.getElementById('assignment-status')
const assignmentsList = document.getElementById('assignments-list')

assignmentForm.addEventListener('submit', e => {
  e.preventDefault()
  const idField = document.getElementById('assignment-id')
  const title = assignmentTitle.value.trim()
  if (!title) return
  const payload = {
    title,
    courseId: assignmentCourse.value || null,
    dueDate: assignmentDue.value || null,
    priority: assignmentPriority.value,
    status: assignmentStatus.value,
  }
  if (idField.value) {
    const id = idField.value
    const a = state.assignments.find(x => x.id === id)
    if (a) Object.assign(a, payload)
    idField.value = ''
    assignmentForm.querySelector('button').textContent = 'Add Assignment'
  } else {
    state.assignments.push(Object.assign({ id: uid(), createdAt: new Date().toISOString() }, payload))
  }
  assignmentTitle.value = ''
  assignmentDue.value = ''
  save(); renderAssignments();
})

function renderCourseOptions() {
  assignmentCourse.innerHTML = ''
  const empty = document.createElement('option'); empty.value=''; empty.textContent='(No course)'
  assignmentCourse.appendChild(empty)
  state.courses.forEach(c => {
    const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name
    assignmentCourse.appendChild(opt)
  })
}

function renderAssignments() {
  assignmentsList.innerHTML = ''
  state.assignments.forEach(a => {
    const li = document.createElement('li'); li.className='item'
    const left = document.createElement('div')
    const course = state.courses.find(c => c.id === a.courseId)
    left.innerHTML = `<strong>${escapeHtml(a.title)}</strong><div class="meta">${course?escapeHtml(course.name):'<small>no course</small>'} • Due: ${a.dueDate||'—'} • Priority: ${a.priority} • Status: ${a.status}</div>`
    const actions = document.createElement('div')
    actions.innerHTML = `<button data-id="${a.id}" class="edit">Edit</button> <button data-id="${a.id}" class="del">Delete</button>`
    li.appendChild(left); li.appendChild(actions)
    assignmentsList.appendChild(li)
  })
}

assignmentsList.addEventListener('click', e => {
  if (e.target.classList.contains('edit')) {
    const id = e.target.dataset.id
    const a = state.assignments.find(x => x.id === id)
    if (a) {
      document.getElementById('assignment-id').value = a.id
      assignmentTitle.value = a.title
      assignmentCourse.value = a.courseId || ''
      assignmentDue.value = a.dueDate || ''
      assignmentPriority.value = a.priority || 'low'
      assignmentStatus.value = a.status || 'unfinished'
      assignmentForm.querySelector('button').textContent = 'Save Assignment'
    }
  }
  if (e.target.classList.contains('del')) {
    const id = e.target.dataset.id
    state.assignments = state.assignments.filter(x => x.id !== id)
    save(); renderAssignments()
  }
})

function escapeHtml(s){ return (s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

// init
load(); renderCourses(); renderCourseOptions(); renderAssignments();

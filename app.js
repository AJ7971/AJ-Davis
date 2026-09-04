// Version 2 - Dashboard, grades, overdue detection, inline controls
const V2_KEY = 'studyPlannerData_v2'
const V1_KEY = 'studyPlannerData_v1'

let state = { courses: [], assignments: [] }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6) }

function load() {
  // Prefer v2 storage; migrate from v1 if present
  const rawV2 = localStorage.getItem(V2_KEY)
  if (rawV2) {
    state = JSON.parse(rawV2)
  } else {
    const rawV1 = localStorage.getItem(V1_KEY)
    if (rawV1) {
      // migrate: add grade=null to assignments
      const s = JSON.parse(rawV1)
      s.assignments = s.assignments.map(a => Object.assign({ grade: null, createdAt: a.createdAt || new Date().toISOString() }, a))
      state = s
      save()
    }
  }
}

function save() { localStorage.setItem(V2_KEY, JSON.stringify(state)) }

// Utilities
function parseDateOnly(s) { if (!s) return null; const d = new Date(s + 'T00:00:00'); return d }
function isOverdue(a) {
  if (a.status === 'complete') return false
  if (!a.dueDate) return false
  const due = parseDateOnly(a.dueDate)
  const today = new Date(); today.setHours(0,0,0,0)
  return due < today
}

function stats() {
  const total = state.assignments.length
  const completed = state.assignments.filter(a => a.status === 'complete').length
  const remaining = total - completed
  const overdue = state.assignments.filter(a => isOverdue(a)).length
  const graded = state.assignments.filter(a => a.grade !== null && !Number.isNaN(Number(a.grade)))
  const average = graded.length ? (graded.reduce((s,a)=>s+Number(a.grade),0)/graded.length) : null
  return { total, completed, remaining, overdue, average }
}

// DOM refs
const courseForm = document.getElementById('course-form')
const courseNameInput = document.getElementById('course-name')
const coursesList = document.getElementById('courses-list')

const assignmentForm = document.getElementById('assignment-form')
const assignmentTitle = document.getElementById('assignment-title')
const assignmentCourse = document.getElementById('assignment-course')
const assignmentDue = document.getElementById('assignment-due')
const assignmentPriority = document.getElementById('assignment-priority')
const assignmentStatus = document.getElementById('assignment-status')
const assignmentGrade = document.getElementById('assignment-grade')
const assignmentsList = document.getElementById('assignments-list')

const statTotal = document.getElementById('stat-total')
const statCompleted = document.getElementById('stat-completed')
const statRemaining = document.getElementById('stat-remaining')
const statOverdue = document.getElementById('stat-overdue')
const statAverage = document.getElementById('stat-average')

const filterStatus = document.getElementById('filter-status')
const sortBy = document.getElementById('sort-by')

// Course handlers
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
  save(); renderCourses(); renderCourseOptions(); renderAssignments(); updateDashboard()
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
    state.assignments = state.assignments.filter(a => a.courseId !== id)
    save(); renderCourses(); renderAssignments(); renderCourseOptions(); updateDashboard()
  }
})

// Assignment handlers
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
    grade: assignmentGrade.value ? Number(assignmentGrade.value) : null,
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
  assignmentGrade.value = ''
  save(); renderAssignments(); updateDashboard()
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

function sortAssignments(list) {
  const s = sortBy.value
  if (s === 'due') {
    list.sort((a,b)=>{
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate) - new Date(b.dueDate)
    })
  } else if (s === 'priority') {
    const score = p => p==='high'?0:p==='medium'?1:2
    list.sort((a,b)=>score(a.priority)-score(b.priority))
  } else if (s === 'created') {
    list.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt))
  }
}

function renderAssignments() {
  assignmentsList.innerHTML = ''
  let list = state.assignments.slice()
  // filter
  const f = filterStatus.value
  if (f !== 'all') list = list.filter(a => a.status === f)
  // sort
  sortAssignments(list)

  list.forEach(a => {
    const li = document.createElement('li'); li.className='item'
    if (isOverdue(a)) li.classList.add('overdue')

    const left = document.createElement('div'); left.className='left'
    const titleClass = a.status==='complete' ? 'completeTitle' : ''
    const course = state.courses.find(c => c.id === a.courseId)
    left.innerHTML = `<div><strong class="${titleClass}">${escapeHtml(a.title)}</strong></div>
      <div class="meta">${course?escapeHtml(course.name):'<small>no course</small>'} • Due: ${a.dueDate||'—'} • Priority: ${a.priority} • Status: ${a.status}</div>`

    const right = document.createElement('div'); right.className='inline-actions'
    // complete toggle
    const toggle = document.createElement('button'); toggle.textContent = a.status==='complete' ? 'Mark Unfinished' : 'Mark Complete'
    toggle.addEventListener('click', () => { a.status = a.status==='complete' ? 'unfinished' : 'complete'; save(); renderAssignments(); updateDashboard() })

    // edit and delete
    const edit = document.createElement('button'); edit.textContent = 'Edit'
    edit.addEventListener('click', () => { document.getElementById('assignment-id').value = a.id; assignmentTitle.value = a.title; assignmentCourse.value = a.courseId || ''; assignmentDue.value = a.dueDate || ''; assignmentPriority.value = a.priority || 'low'; assignmentStatus.value = a.status || 'unfinished'; assignmentGrade.value = a.grade!==null? a.grade : '' ; assignmentForm.querySelector('button').textContent = 'Save Assignment' })

    const del = document.createElement('button'); del.textContent = 'Delete'
    del.addEventListener('click', () => { state.assignments = state.assignments.filter(x=>x.id!==a.id); save(); renderAssignments(); updateDashboard() })

    // inline grade input
    const gradeInput = document.createElement('input'); gradeInput.type='number'; gradeInput.step='0.1'; gradeInput.className='inline-grade'; gradeInput.placeholder='Grade'; gradeInput.value = a.grade!==null? a.grade : ''
    gradeInput.addEventListener('change', () => { a.grade = gradeInput.value!=='' ? Number(gradeInput.value) : null; save(); updateDashboard() })

    right.appendChild(toggle); right.appendChild(gradeInput); right.appendChild(edit); right.appendChild(del)

    li.appendChild(left); li.appendChild(right)
    assignmentsList.appendChild(li)
  })
}

// small helpers
function escapeHtml(s){ return (s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

function updateDashboard(){
  const s = stats()
  statTotal.textContent = s.total
  statCompleted.textContent = s.completed
  statRemaining.textContent = s.remaining
  statOverdue.textContent = s.overdue
  statAverage.textContent = s.average!==null ? Number(s.average).toFixed(2) : '—'
}

// wire filter/sort
filterStatus.addEventListener('change', ()=> { renderAssignments() })
sortBy.addEventListener('change', ()=> { renderAssignments() })

// init
load(); renderCourses(); renderCourseOptions(); renderAssignments(); updateDashboard()

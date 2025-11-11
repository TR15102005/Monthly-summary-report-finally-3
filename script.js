// Load USERS from localStorage or use defaults. Using 'let' to allow Admin to add new users.
let USERS = JSON.parse(localStorage.getItem('attendanceUsers')) || {
    'admin': { password: 'admin123', role: 'admin', name: 'System Admin' },
    'teacher': { password: 'teacher123', role: 'teacher', name: 'Ms. Smith' }
};

// Load ATTENDANCE_RECORDS from localStorage.
// Format: ATTENDANCE_RECORDS['YYYY-MM-DD'][studentId] = 'Present' | 'Absent'
let ATTENDANCE_RECORDS = JSON.parse(localStorage.getItem('attendanceRecords')) || {};

// Simulated Student Data (remains fixed for all students in the system)
// The presentCount/absentCount fields are now ignored in favor of dynamically calculating monthly totals
const STUDENT_DATA = [
    { id: 101, name: 'Alex Johnson' },
    { id: 102, name: 'Bella Cruz' },
    { id: 103, name: 'Chris Evans' },
    { id: 104, name: 'David Lee' },
    { id: 105, name: 'Emily White' },
];

const isReportPage = document.getElementById('main-navbar') !== null;
const isLoginPage = document.getElementById('login-form') !== null;

document.addEventListener('DOMContentLoaded', function() {
    
    // --- LOGIN PAGE LOGIC ---
    if (isLoginPage) {
        const loginForm = document.getElementById('login-form');
        const errorAlert = document.getElementById('login-error');

        loginForm?.addEventListener('submit', function(e) {
            e.preventDefault();
            errorAlert?.classList.add('d-none');
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            const user = USERS[username];

            if (user && user.password === password) {
                sessionStorage.setItem('userRole', user.role);
                sessionStorage.setItem('userName', user.name);
                sessionStorage.setItem('isLoggedIn', 'true');
                
                window.location.href = 'index.html'; 
            } else {
                errorAlert.textContent = "Invalid username or password.";
                errorAlert.classList.remove('d-none');
            }
        });
    } 
    
    // --- REPORT PAGE LOGIC ---
    else if (isReportPage) {
        
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        const currentUserRole = sessionStorage.getItem('userRole');
        const currentUserName = sessionStorage.getItem('userName');
        const logoutButton = document.getElementById('logout-btn');

        if (!isLoggedIn) {
            window.location.href = 'login.html';
            return;
        }

        document.getElementById('welcome-header').textContent = `Welcome, ${currentUserName}!`;

        // 2. Role-based View Toggle
        document.querySelectorAll('.default-hidden').forEach(el => el.style.display = 'none');
        if (currentUserRole === 'admin') {
            document.getElementById('admin-view').style.display = 'block';
            document.getElementById('admin-date-select').valueAsDate = new Date();
        } else if (currentUserRole === 'teacher') {
            document.getElementById('teacher-view').style.display = 'block';
        }

        // 3. Logout Logic
        logoutButton.addEventListener('click', function() {
            if (confirm("Are you sure you want to log out?")) {
                sessionStorage.clear(); 
                window.location.href = 'login.html'; 
            }
        });

        // ----------------------------------------------------------------------
        // --- ADMIN VIEW LOGIC (Daily Marking and Persistence) ---
        // ----------------------------------------------------------------------
        const adminDateSelect = document.getElementById('admin-date-select');
        const loadStudentsBtn = document.getElementById('load-students-btn');
        const adminAttendanceBody = document.getElementById('admin-attendance-body');
        const downloadPdfBtn = document.getElementById('download-pdf-btn');
        const downloadExcelBtn = document.getElementById('download-excel-btn');
        const createUserForm = document.getElementById('create-user-form');
        const userCreationMessage = document.getElementById('user-creation-message');

        loadStudentsBtn?.addEventListener('click', function() {
            const selectedDate = adminDateSelect.value;
            if (!selectedDate) {
                alert("Please select a date.");
                return;
            }
            
            const dateObj = new Date(selectedDate);
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('current-date-span').textContent = dateObj.toLocaleDateString('en-US', options);

            renderAdminAttendance(STUDENT_DATA, selectedDate);
        });

        function renderAdminAttendance(students, selectedDate) {
            // Ensure the record object for the selected date exists
            if (!ATTENDANCE_RECORDS[selectedDate]) {
                ATTENDANCE_RECORDS[selectedDate] = {};
            }
            
            adminAttendanceBody.innerHTML = '';
            students.forEach(student => {
                // Read status specifically for the selected date
                const currentStatus = ATTENDANCE_RECORDS[selectedDate][student.id] || 'Not Marked';

                const row = adminAttendanceBody.insertRow();
                row.insertCell().textContent = student.id;
                row.insertCell().textContent = student.name;
                
                const statusCell = row.insertCell();
                statusCell.textContent = currentStatus;
                statusCell.id = `status-${student.id}`;
                statusCell.className = currentStatus === 'Present' ? 'text-success fw-bold' : (currentStatus === 'Absent' ? 'text-danger fw-bold' : '');


                const actionCell = row.insertCell();
                actionCell.innerHTML = `
                    <button class="btn btn-sm btn-success mark-btn" data-id="${student.id}" data-status="Present">Present</button>
                    <button class="btn btn-sm btn-danger mark-btn ms-2" data-id="${student.id}" data-status="Absent">Absent</button>
                `;
            });
            
            document.querySelectorAll('.mark-btn').forEach(btn => {
                btn.addEventListener('click', handleAttendanceMarking);
            });
        }

        function handleAttendanceMarking(event) {
            const studentId = event.target.dataset.id;
            const status = event.target.dataset.status;
            const statusCell = document.getElementById(`status-${studentId}`);
            const selectedDate = adminDateSelect.value; 

            if (!selectedDate) {
                 alert("Error: No date selected.");
                 return;
            }
            
            // 1. Update UI
            statusCell.textContent = status;
            statusCell.className = status === 'Present' ? 'text-success fw-bold' : 'text-danger fw-bold';
            
            // 2. STATE MANAGEMENT: Update the ATTENDANCE_RECORDS object for the specific date
            if (!ATTENDANCE_RECORDS[selectedDate]) {
                ATTENDANCE_RECORDS[selectedDate] = {};
            }
            ATTENDANCE_RECORDS[selectedDate][studentId] = status;
            
            // 3. PERSISTENCE
            localStorage.setItem('attendanceRecords', JSON.stringify(ATTENDANCE_RECORDS));

            console.log(`Attendance marked and saved: Date: ${selectedDate}, Student: ${studentId}, Status: ${status}`);
        }
        
        // Admin Download Handlers (Simulated)
        downloadPdfBtn?.addEventListener('click', function() {
            alert("ADMIN: Simulating PDF Download... (Requires Java backend implementation)");
        });

        downloadExcelBtn?.addEventListener('click', function() {
            alert("ADMIN: Simulating Excel/CSV Download... (Requires Java backend implementation)");
        });
        
        // Create User Handler
        createUserForm?.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newUsername = document.getElementById('new-username').value;
            const newPassword = document.getElementById('new-password').value;
            const newRole = document.getElementById('new-role').value;
            userCreationMessage.classList.add('d-none'); 

            if (USERS[newUsername]) {
                userCreationMessage.className = 'alert alert-danger';
                userCreationMessage.textContent = `User ID "${newUsername}" already exists.`;
                userCreationMessage.classList.remove('d-none');
                return;
            }

            USERS[newUsername] = { 
                password: newPassword, 
                role: newRole, 
                name: newUsername
            };
            
            localStorage.setItem('attendanceUsers', JSON.stringify(USERS));
            
            userCreationMessage.className = 'alert alert-success';
            userCreationMessage.textContent = `User "${newUsername}" (${newRole}) created successfully!`;
            userCreationMessage.classList.remove('d-none');
            createUserForm.reset();
        });
        
        // ----------------------------------------------------------------------
        // --- TEACHER VIEW LOGIC (Monthly Reporting) ---
        // ----------------------------------------------------------------------
        const viewReportBtn = document.getElementById('view-report-btn');
        const teacherReportBody = document.getElementById('teacher-report-body');
        const teacherDateSelect = document.getElementById('teacher-date-select'); 
        const teacherYearSelect = document.getElementById('teacher-year-select'); 
        const attendanceBarChartContext = document.getElementById('attendanceBarChart')?.getContext('2d');
        const teacherDownloadPdfBtn = document.getElementById('teacher-download-pdf-btn'); 
        const teacherDownloadExcelBtn = document.getElementById('teacher-download-excel-btn');
        let chartInstance = null; 
        
        // Teacher Download Handlers (Simulated)
        teacherDownloadPdfBtn?.addEventListener('click', function() {
            alert("TEACHER: Simulating PDF Download for selected date range.");
        });

        teacherDownloadExcelBtn?.addEventListener('click', function() {
            alert("TEACHER: Simulating Excel/CSV Download for selected date range.");
        });

        function populateYearSelector() {
            const currentYear = new Date().getFullYear();
            const startYear = currentYear - 5; 
            const endYear = currentYear + 1;   

            if (teacherYearSelect) {
                for (let year = startYear; year <= endYear; year++) {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    if (year === currentYear) {
                        option.selected = true;
                    }
                    teacherYearSelect.appendChild(option);
                }
            }
            if (teacherDateSelect) {
                 teacherDateSelect.valueAsDate = new Date(); 
            }
        }
        
        if (currentUserRole === 'teacher') {
             populateYearSelector();
        }

        viewReportBtn?.addEventListener('click', function() {
            const selectedDate = teacherDateSelect.value;
            const selectedYear = teacherYearSelect.value;
            
            if (!selectedDate || !selectedYear) {
                alert("Please select both a date and a year.");
                return;
            }
            
            // Extract the month and year from the date selector (e.g., '2025-11-11' -> '2025-11')
            const selectedMonthYear = selectedDate.substring(0, 7); 
            
            generateMonthlyReport(STUDENT_DATA, selectedMonthYear);
        });


        // Function: Aggregates daily data for the selected month
        function generateMonthlyReport(students, selectedMonthYear) {
            // Get all date keys that start with the selected month/year
            const monthlyRecordsKeys = Object.keys(ATTENDANCE_RECORDS).filter(dateKey => 
                dateKey.startsWith(selectedMonthYear)
            );
            
            // Check if any daily attendance was marked by Admin for this period
            if (monthlyRecordsKeys.length === 0) {
                teacherReportBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No attendance data found for the selected month/year. The Admin needs to mark attendance first.</td></tr>`;
                drawBarChart([], []); // Clear the chart
                return;
            }
            
            const aggregatedData = {};
            const totalDaysMarked = monthlyRecordsKeys.length;

            // Initialize aggregated data structure for all students
            students.forEach(student => {
                aggregatedData[student.id] = {
                    id: student.id,
                    name: student.name,
                    presentCount: 0,
                    absentCount: 0,
                    totalDays: totalDaysMarked 
                };
            });

            // Iterate over all marked days in the month and sum up the status counts
            monthlyRecordsKeys.forEach(dateKey => {
                const dailyRecord = ATTENDANCE_RECORDS[dateKey];
                
                students.forEach(student => {
                    const status = dailyRecord[student.id];
                    if (status === 'Present') {
                        aggregatedData[student.id].presentCount++;
                    } else if (status === 'Absent') {
                        aggregatedData[student.id].absentCount++;
                    }
                });
            });

            const reportData = Object.values(aggregatedData);
            renderTeacherReport(reportData);
        }

        function renderTeacherReport(data) {
            teacherReportBody.innerHTML = '';
            
            const studentNames = [];
            const attendancePercentages = [];

            data.forEach(student => {
                const row = teacherReportBody.insertRow();
                row.insertCell().textContent = student.id;
                row.insertCell().textContent = student.name;
                row.insertCell().textContent = student.presentCount;
                row.insertCell().textContent = student.absentCount;
                
                const totalMarkedDays = student.presentCount + student.absentCount;
                const percentage = totalMarkedDays > 0 
                                   ? Math.round((student.presentCount / totalMarkedDays) * 100) 
                                   : 0;

                studentNames.push(student.name);
                attendancePercentages.push(percentage);
            });
            
            drawBarChart(studentNames, attendancePercentages);
        }

        function drawBarChart(labels, data) {
             if (chartInstance) {
                chartInstance.destroy(); 
             }

             if (!attendanceBarChartContext) return;
             
             chartInstance = new Chart(attendanceBarChartContext, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Attendance Percentage (%)',
                        data: data,
                        backgroundColor: '#0f4c75', 
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            title: { display: true, text: 'Percentage' }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Student Monthly Attendance' }
                    }
                }
            });
        }
        
        // Initial load for teacher view
        if (currentUserRole === 'teacher') {
             setTimeout(() => {
                if (viewReportBtn) {
                    viewReportBtn.click();
                }
             }, 50);
        }
    }
});
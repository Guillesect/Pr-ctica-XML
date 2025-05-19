let startTime;
let timerInterval;
let currentQuestions;
let currentQuestionIndex = 0;
let userAnswers = new Map(); // Para almacenar las respuestas

document.addEventListener('DOMContentLoaded', () => {
    loadQuestions('es');
    startTimer();
    
    document.getElementById('language').addEventListener('change', (e) => {
        loadQuestions(e.target.value);
        resetTimer();
    });
    
    document.getElementById('submit').addEventListener('click', checkAnswers);
    document.getElementById('retry').addEventListener('click', resetQuiz);
});

function loadQuestions(lang) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `preguntas_${lang}.xml`, true);
    
    xhr.onload = function() {
        if (xhr.status === 200) {
            const xmlDoc = xhr.responseXML;
            currentQuestions = Array.from(xmlDoc.getElementsByTagName('question'));
            currentQuestionIndex = 0;
            displayCurrentQuestion();
        } else {
            console.error('Error al cargar las preguntas');
            document.getElementById('quiz-container').innerHTML = 
                '<p>Error al cargar las preguntas. Por favor, intente de nuevo.</p>';
        }
    };
    
    xhr.onerror = function() {
        console.error('Error de red al cargar las preguntas');
        document.getElementById('quiz-container').innerHTML = 
            '<p>Error de conexión. Por favor, verifique su conexión a internet.</p>';
    };
    
    xhr.send();
}

function startTimer() {
    startTime = new Date();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const currentTime = new Date();
    const diff = currentTime - startTime;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function resetTimer() {
    clearInterval(timerInterval);
    startTimer();
}

function displayCurrentQuestion() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = '';
    
    if (currentQuestionIndex >= currentQuestions.length) {
        checkAnswers();
        return;
    }
    
    const lang = document.getElementById('language').value;
    const question = currentQuestions[currentQuestionIndex];
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question';
    
    const questionId = question.getAttribute('id');
    const savedAnswer = userAnswers.get(questionId);
    
    questionDiv.innerHTML = `
        <p class="question-counter">
            ${lang === 'en' ? 'Question' : 'Pregunta'} ${currentQuestionIndex + 1} 
            ${lang === 'en' ? 'of' : 'de'} ${currentQuestions.length}
        </p>
        <p class="question-text">${question.getElementsByTagName('wording')[0].textContent}</p>
        ${Array.from(question.getElementsByTagName('choice')).map((choice, idx) => {
            const isChecked = savedAnswer === idx.toString() ? 'checked' : '';
            return `
                <div class="choice-container">
                    <input type="radio" name="q${questionId}" value="${idx}" 
                           id="q${currentQuestionIndex}opt${idx}" ${isChecked}>
                    <label for="q${currentQuestionIndex}opt${idx}">${choice.textContent}</label>
                </div>
            `;
        }).join('')}
        <div class="button-container">
            ${currentQuestionIndex > 0 ? 
                `<button onclick="previousQuestion()" class="nav-button">
                    ${lang === 'en' ? 'Previous' : 'Anterior'}
                </button>` : ''}
            ${currentQuestionIndex === currentQuestions.length - 1 ? 
                `<button onclick="checkAnswers()" class="nav-button">
                    ${lang === 'en' ? 'Finish' : 'Finalizar'}
                </button>` :
                `<button onclick="nextQuestion()" class="nav-button">
                    ${lang === 'en' ? 'Next' : 'Siguiente'}
                </button>`}
        </div>
    `;
    
    container.appendChild(questionDiv);

    // Añadir event listener para guardar la respuesta cuando se selecciona
    const radioButtons = questionDiv.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            userAnswers.set(questionId, radio.value);
        });
    });
}

function nextQuestion() {
    const currentQuestion = currentQuestions[currentQuestionIndex];
    const questionId = currentQuestion.getAttribute('id');
    const selectedAnswer = document.querySelector(`input[name="q${questionId}"]:checked`);
    const lang = document.getElementById('language').value;
    
    if (!selectedAnswer && currentQuestionIndex < currentQuestions.length - 1) {
        alert(lang === 'en' ? 
            'Please select an answer before continuing.' : 
            'Por favor, selecciona una respuesta antes de continuar.');
        return;
    }

    if (selectedAnswer) {
        userAnswers.set(questionId, selectedAnswer.value);
    }
    
    currentQuestionIndex++;
    if (currentQuestionIndex >= currentQuestions.length) {
        checkAnswers();
    } else {
        displayCurrentQuestion();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        const currentQuestion = currentQuestions[currentQuestionIndex];
        const questionId = currentQuestion.getAttribute('id');
        const selectedAnswer = document.querySelector(`input[name="q${questionId}"]:checked`);
        
        if (selectedAnswer) {
            userAnswers.set(questionId, selectedAnswer.value);
        }
        
        currentQuestionIndex--;
        displayCurrentQuestion();
    }
}

function resetQuiz() {
    userAnswers.clear();
    document.getElementById('result').classList.add('hidden');
    document.getElementById('retry').classList.add('hidden');
    document.getElementById('submit').style.display = 'block';
    currentQuestionIndex = 0;
    loadQuestions(document.getElementById('language').value);
    resetTimer();
}

function checkAnswers() {
    let correctAnswers = 0;
    const totalQuestions = currentQuestions.length;
    const lang = document.getElementById('language').value;
    
    // Guardamos la respuesta actual antes de verificar
    const currentQuestion = currentQuestions[currentQuestionIndex];
    if (currentQuestion) {
        const questionId = currentQuestion.getAttribute('id');
        const selectedAnswer = document.querySelector(`input[name="q${questionId}"]:checked`);
        if (selectedAnswer) {
            userAnswers.set(questionId, selectedAnswer.value);
        }
    }
    
    // Verificamos todas las respuestas guardadas
    for (let i = 0; i < currentQuestions.length; i++) {
        const question = currentQuestions[i];
        const questionId = question.getAttribute('id');
        const userAnswer = userAnswers.get(questionId);
        const choices = question.getElementsByTagName('choice');
        
        if (userAnswer !== undefined) {
            const selectedChoice = choices[parseInt(userAnswer)];
            if (selectedChoice && selectedChoice.getAttribute('correct') === 'yes') {
                correctAnswers++;
            }
        }
    }
    
    // Ocultamos el botón de enviar respuestas
    const enviarRespuestasButton = document.querySelector('button.nav-button[onclick="checkAnswers()"], button.nav-button[onclick="Enviar respuestas"]');
    if (enviarRespuestasButton) {
        enviarRespuestasButton.style.display = 'none';
    }
    
    // También ocultamos el botón con id 'submit'
    const submitButton = document.getElementById('submit');
    if (submitButton) {
        submitButton.style.display = 'none';
    }
    
    const container = document.getElementById('quiz-container');
    const resultText = lang === 'en' ? 
        `You got ${correctAnswers} out of ${totalQuestions} questions correct!` :
        `Has acertado ${correctAnswers} de ${totalQuestions} preguntas`;
    
    const isPassed = correctAnswers >= 10;
    const resultClass = isPassed ? 'passed' : 'failed';
    
    container.innerHTML = `
        <div class="result ${resultClass}">
            <h2>${lang === 'en' ? 'Quiz completed!' : '¡Cuestionario completado!'}</h2>
            <p>${resultText}</p>
        </div>
    `;
}
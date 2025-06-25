document.addEventListener('DOMContentLoaded', () => {
    const feedbackInput = document.getElementById('feedback-input');
    const addFeedbackBtn = document.getElementById('add-feedback-btn');
    const feedbackListContainer = document.getElementById('feedback-list-container');

    addFeedbackBtn.addEventListener('click', () => {
        const feedbackText = feedbackInput.value.trim();

        if (feedbackText !== '') {
            const note = document.createElement('div');
            note.classList.add('feedback-note');
            note.textContent = feedbackText;
            feedbackListContainer.appendChild(note);
            feedbackInput.value = '';
            feedbackInput.focus();
        }
    });

    feedbackInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addFeedbackBtn.click();
        }
    });
}); 
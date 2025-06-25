document.addEventListener('DOMContentLoaded', () => {
    // Feedback list elements
    const feedbackInput = document.getElementById('feedback-input');
    const addFeedbackBtn = document.getElementById('add-feedback-btn');
    const feedbackListContainer = document.getElementById('feedback-list-container');

    // Modal elements
    const modalOverlay = document.getElementById('modal-overlay');
    const feedbackModal = document.getElementById('feedback-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalText = document.getElementById('modal-text');
    const modalEditInput = document.getElementById('modal-edit-input');
    const modalEditBtn = document.getElementById('modal-edit-btn');
    const modalDeleteBtn = document.getElementById('modal-delete-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');

    let activeNote = null;
    let originalText = '';

    function createFeedbackNote(text) {
        const note = document.createElement('div');
        note.classList.add('feedback-note');
        note.textContent = text;
        
        note.addEventListener('click', () => {
            openModal(note);
        });

        feedbackListContainer.appendChild(note);
    }

    function openModal(note) {
        activeNote = note;
        originalText = note.textContent;
        modalText.textContent = originalText;
        modalEditInput.value = originalText;

        exitEditMode(); // Reset to view mode
        modalOverlay.style.display = 'block';
        feedbackModal.style.display = 'block';
    }

    function closeModal() {
        const wasInEditMode = !modalEditInput.classList.contains('hidden');
        const isTextChanged = modalEditInput.value.trim() !== originalText;

        if (wasInEditMode && isTextChanged) {
            if (confirm('You have unsaved changes. Do you want to save them?')) {
                saveNote();
            }
        }
        
        modalOverlay.style.display = 'none';
        feedbackModal.style.display = 'none';
        activeNote = null;
        originalText = '';
    }

    function enterEditMode() {
        modalText.classList.add('hidden');
        modalEditInput.classList.remove('hidden');
        modalEditBtn.classList.add('hidden');
        modalSaveBtn.classList.remove('hidden');
        modalEditInput.focus();
    }

    function exitEditMode() {
        modalText.classList.remove('hidden');
        modalEditInput.classList.add('hidden');
        modalEditBtn.classList.remove('hidden');
        modalSaveBtn.classList.add('hidden');
    }

    function saveNote() {
        const newText = modalEditInput.value.trim();
        if (newText) {
            activeNote.textContent = newText;
            originalText = newText; // Update original text to prevent re-prompting
            modalText.textContent = newText;
            exitEditMode();
            closeModal();
        } else {
            alert("Note cannot be empty.");
        }
    }


    function deleteNote() {
        if (confirm('Are you sure you want to delete this note?')) {
            activeNote.remove();
            closeModal();
        }
    }

    addFeedbackBtn.addEventListener('click', () => {
        const feedbackText = feedbackInput.value.trim();
        if (feedbackText !== '') {
            createFeedbackNote(feedbackText);

            feedbackInput.value = '';
            feedbackInput.focus();
        }
    });

    feedbackInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addFeedbackBtn.click();
        }
    });

    // Modal event listeners
    modalCloseBtn.addEventListener('click', closeModal);
    modalEditBtn.addEventListener('click', enterEditMode);
    modalSaveBtn.addEventListener('click', saveNote);
    modalDeleteBtn.addEventListener('click', deleteNote);
    modalOverlay.addEventListener('click', closeModal);
}); 
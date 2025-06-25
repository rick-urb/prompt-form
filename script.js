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

    let activeNoteElement = null;
    let originalText = '';

    // --- Data Functions ---
    async function getFeedbackNotes() {
        const response = await fetch('/api/feedback');
        if (!response.ok) {
            console.error('Failed to fetch notes');
            return;
        }
        const notes = await response.json();
        feedbackListContainer.innerHTML = '';
        notes.forEach(note => createFeedbackNoteElement(note));
    }

    async function addFeedbackNote(text) {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (!response.ok) {
            console.error('Failed to add note');
            return;
        }
        const newNote = await response.json();
        createFeedbackNoteElement(newNote);
    }

    async function updateFeedbackNote(id, text) {
        const response = await fetch('/api/feedback', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, text }),
        });
         if (!response.ok) {
            console.error('Failed to update note');
            return false;
        }
        return true;
    }

    async function deleteFeedbackNote(id) {
        const response = await fetch('/api/feedback', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (!response.ok) {
            console.error('Failed to delete note');
            return false;
        }
        return true;
    }

    // --- DOM Functions ---
    function createFeedbackNoteElement({ id, text }) {
        const noteElement = document.createElement('div');
        noteElement.classList.add('feedback-note');
        noteElement.dataset.id = id;
        noteElement.dataset.fullText = text;

        if (text.length > 25) {
            noteElement.textContent = text.substring(0, 25) + '...';
        } else {
            noteElement.textContent = text;
        }
        
        noteElement.addEventListener('click', () => {
            openModal(noteElement);
        });

        feedbackListContainer.appendChild(noteElement);
    }

    // --- Modal Functions ---
    function openModal(noteElement) {
        activeNoteElement = noteElement;
        const fullText = noteElement.dataset.fullText;
        originalText = fullText;
        modalText.textContent = fullText;
        modalEditInput.value = fullText;

        exitEditMode();
        modalOverlay.style.display = 'block';
        feedbackModal.style.display = 'block';
    }

    function closeModal() {
        const wasInEditMode = !modalEditInput.classList.contains('hidden');
        const isTextChanged = modalEditInput.value.trim() !== originalText;

        if (wasInEditMode && isTextChanged) {
            if (confirm('You have unsaved changes. Do you want to save them?')) {
                saveNote(); // saveNote will handle closing
                return; 
            }
        }
        
        modalOverlay.style.display = 'none';
        feedbackModal.style.display = 'none';
        activeNoteElement = null;
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

    async function saveNote() {
        const newText = modalEditInput.value.trim();
        const noteId = activeNoteElement.dataset.id;
        if (newText && noteId) {
            const success = await updateFeedbackNote(noteId, newText);
            if(success) {
                activeNoteElement.dataset.fullText = newText;
                if (newText.length > 25) {
                    activeNoteElement.textContent = newText.substring(0, 25) + '...';
                } else {
                    activeNoteElement.textContent = newText;
                }
                
                originalText = newText;
                modalText.textContent = newText;
                exitEditMode();
                closeModal();
            } else {
                alert("Failed to save the note. Please try again.");
            }
        } else if (!newText) {
            alert("Note cannot be empty.");
        }
    }


    async function deleteNote() {
        const noteId = activeNoteElement.dataset.id;
        if (confirm('Are you sure you want to delete this note?')) {
            const success = await deleteFeedbackNote(noteId);
            if(success) {
                activeNoteElement.remove();
                closeModal();
            } else {
                alert("Failed to delete the note. Please try again.");
            }
        }
    }

    // --- Event Listeners ---
    addFeedbackBtn.addEventListener('click', () => {
        const feedbackText = feedbackInput.value.trim();
        if (feedbackText !== '') {
            addFeedbackNote(feedbackText);
            feedbackInput.value = '';
            feedbackInput.focus();
        }
    });

    feedbackInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addFeedbackBtn.click();
        }
    });

    modalCloseBtn.addEventListener('click', closeModal);
    modalEditBtn.addEventListener('click', enterEditMode);
    modalSaveBtn.addEventListener('click', saveNote);
    modalDeleteBtn.addEventListener('click', deleteNote);
    modalOverlay.addEventListener('click', closeModal);

    // Initial Load
    getFeedbackNotes();
}); 
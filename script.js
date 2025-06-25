document.addEventListener('DOMContentLoaded', () => {
    // Main form elements
    const feedbackInput = document.getElementById('feedback-input');
    const addFeedbackBtn = document.getElementById('add-feedback-btn');
    const feedbackListContainer = document.getElementById('feedback-list-container');
    const imageUploadInput = document.getElementById('image-upload-input');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');

    // Modal elements
    const modalOverlay = document.getElementById('modal-overlay');
    const feedbackModal = document.getElementById('feedback-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalText = document.getElementById('modal-text');
    const modalImage = document.getElementById('modal-image');
    const modalEditInput = document.getElementById('modal-edit-input');
    const modalEditBtn = document.getElementById('modal-edit-btn');
    const modalDeleteBtn = document.getElementById('modal-delete-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');

    // --- PROMPT BUILDER TEMPLATES ---
    const templateListContainer = document.getElementById('template-list-container');
    const templateContentContainer = document.getElementById('template-content-container');
    const showAddTemplateBtn = document.getElementById('show-add-template-btn');
    const addTemplateForm = document.getElementById('add-template-form');
    const newTemplateNameInput = document.getElementById('new-template-name');
    const newTemplateContentInput = document.getElementById('new-template-content');
    const saveTemplateBtn = document.getElementById('save-template-btn');
    const cancelTemplateBtn = document.getElementById('cancel-template-btn');
    const templatePreviewIframe = document.getElementById('template-preview-iframe');
    const templateListView = document.getElementById('template-list-view');
    const templateContentView = document.getElementById('template-content-view');
    const backToListBtn = document.getElementById('back-to-list-btn');
    const templateTitle = document.getElementById('template-title');
    const templateTitleInput = document.getElementById('template-title-input');
    const templateContentInput = document.getElementById('template-content-input');
    const templateEditActions = document.getElementById('template-edit-actions');

    let activeNoteElement = null;
    let originalText = '';
    let currentFile = null;
    let templates = [];
    let selectedTemplateId = null;
    let editingTemplateId = null;
    let isEditingTemplate = false;
    let isAddingTemplate = false;
    let currentTemplate = null;

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

    async function addFeedbackNote(text, imageUrl) {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, imageUrl }),
        });
        if (!response.ok) {
            console.error('Failed to add note');
            return;
        }
        const newNote = await response.json();
        createFeedbackNoteElement(newNote);
    }

    async function updateFeedbackNote(id, text, imageUrl) {
        const response = await fetch('/api/feedback', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, text, imageUrl }),
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

    async function uploadImage(file) {
        const response = await fetch(`/api/upload?filename=${file.name}`, {
            method: 'POST',
            body: file,
        });
        if (!response.ok) {
            console.error('Failed to upload image');
            return null;
        }
        const newBlob = await response.json();
        return newBlob.url;
    }

    async function fetchTemplates() {
        const res = await fetch('/api/templates');
        if (!res.ok) return;
        templates = await res.json();
        renderTemplateList();
    }

    // --- DOM Functions ---
    function createFeedbackNoteElement({ id, text, imageUrl }) {
        const noteElement = document.createElement('div');
        noteElement.classList.add('feedback-note');
        noteElement.dataset.id = id;
        noteElement.dataset.fullText = text;
        noteElement.dataset.imageUrl = imageUrl || '';

        const displayText = (imageUrl ? '📷 ' : '') + text;
        if (displayText.length > 25) {
            noteElement.textContent = displayText.substring(0, 25) + '...';
        } else {
            noteElement.textContent = displayText;
        }
        
        noteElement.addEventListener('click', () => {
            openModal(noteElement);
        });

        feedbackListContainer.appendChild(noteElement);
    }

    function resetForm() {
        feedbackInput.value = '';
        imageUploadInput.value = ''; // Reset file input
        currentFile = null;
        imagePreview.src = '';
        imagePreview.classList.add('hidden');
        removeImageBtn.classList.add('hidden');
    }

    // --- Modal Functions ---
    function openModal(noteElement) {
        activeNoteElement = noteElement;
        const fullText = noteElement.dataset.fullText;
        const imageUrl = noteElement.dataset.imageUrl;

        originalText = fullText;
        modalText.textContent = fullText;
        modalEditInput.value = fullText;

        if (imageUrl) {
            modalImage.src = imageUrl;
            modalImage.classList.remove('hidden');
        } else {
            modalImage.src = '';
            modalImage.classList.add('hidden');
        }

        exitEditMode();
        modalOverlay.style.display = 'block';
        feedbackModal.style.display = 'block';
    }

    function closeModal() {
        const wasInEditMode = !modalEditInput.classList.contains('hidden');
        const isTextChanged = modalEditInput.value.trim() !== originalText;

        if (wasInEditMode && isTextChanged) {
            if (confirm('You have unsaved changes. Do you want to save them?')) {
                saveNote();
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
        modalImage.classList.add('hidden'); // Hide image in edit mode
        modalEditInput.classList.remove('hidden');
        modalEditBtn.classList.add('hidden');
        modalSaveBtn.classList.remove('hidden');
        modalEditInput.focus();
    }

    function exitEditMode() {
        modalText.classList.remove('hidden');
        // only show image if it exists
        if (activeNoteElement && activeNoteElement.dataset.imageUrl) {
             modalImage.classList.remove('hidden');
        }
        modalEditInput.classList.add('hidden');
        modalEditBtn.classList.remove('hidden');
        modalSaveBtn.classList.add('hidden');
    }

    async function saveNote() {
        const newText = modalEditInput.value.trim();
        const noteId = activeNoteElement.dataset.id;
        const imageUrl = activeNoteElement.dataset.imageUrl;

        if (newText && noteId) {
            const success = await updateFeedbackNote(noteId, newText, imageUrl);
            if(success) {
                // Update the note in the list
                activeNoteElement.dataset.fullText = newText;
                const displayText = (imageUrl ? '📷 ' : '') + newText;
                 if (displayText.length > 25) {
                    activeNoteElement.textContent = displayText.substring(0, 25) + '...';
                } else {
                    activeNoteElement.textContent = displayText;
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
    addFeedbackBtn.addEventListener('click', async () => {
        const feedbackText = feedbackInput.value.trim();
        if (feedbackText === '' && !currentFile) {
            alert("Please enter some text or select an image.");
            return;
        }

        let imageUrl = null;
        if (currentFile) {
            imageUrl = await uploadImage(currentFile);
            if (!imageUrl) {
                alert("Image upload failed. Please try again.");
                return;
            }
        }

        await addFeedbackNote(feedbackText, imageUrl);
        resetForm();
        feedbackInput.focus();
    });

    feedbackInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Allow shift+enter for new line
            e.preventDefault();
            addFeedbackBtn.click();
        }
    });
    
    imageUploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            currentFile = e.target.files[0];
            imagePreview.src = URL.createObjectURL(currentFile);
            imagePreview.classList.remove('hidden');
            removeImageBtn.classList.remove('hidden');
        }
    });

    removeImageBtn.addEventListener('click', () => {
        resetForm();
    });

    modalCloseBtn.addEventListener('click', closeModal);
    modalEditBtn.addEventListener('click', enterEditMode);
    modalSaveBtn.addEventListener('click', saveNote);
    modalDeleteBtn.addEventListener('click', deleteNote);
    modalOverlay.addEventListener('click', closeModal);

    // --- PROMPT BUILDER TEMPLATES ---
    function renderTemplateList() {
        templateListContainer.innerHTML = '';
        templates.forEach(t => {
            const btn = document.createElement('button');
            btn.className = 'template-btn';
            btn.textContent = t.name;
            btn.onclick = () => {
                selectedTemplateId = t.id;
                isAddingTemplate = false;
                showTemplateContent(t.id);
            };
            templateListContainer.appendChild(btn);
        });
    }

    function showTemplateContent(id) {
        templateListView.classList.add('hidden');
        templateContentView.classList.remove('hidden');
        templateEditActions.classList.add('hidden');
        templateTitleInput.classList.add('hidden');
        templateContentInput.classList.add('hidden');
        templateTitle.classList.remove('hidden');
        templateContentContainer.classList.remove('hidden');
        isEditingTemplate = false;

        if (isAddingTemplate) {
            currentTemplate = { id: null, name: '', content: '' };
            templateTitle.textContent = 'Click to enter title';
            templateContentContainer.textContent = 'Click to enter content';
        } else {
            currentTemplate = templates.find(t => t.id === id);
            if (!currentTemplate) return;
            templateTitle.textContent = currentTemplate.name;
            templateContentContainer.innerHTML = currentTemplate.content;
        }
    }

    // Inline editing for title
    templateTitle.onclick = () => {
        if (!isEditingTemplate) {
            templateTitleInput.value = currentTemplate ? currentTemplate.name : '';
            templateTitle.classList.add('hidden');
            templateTitleInput.classList.remove('hidden');
            templateTitleInput.focus();
            isEditingTemplate = true;
            templateEditActions.classList.remove('hidden');
        }
    };
    templateTitleInput.onblur = () => {
        if (isEditingTemplate) {
            templateTitleInput.classList.add('hidden');
            templateTitle.classList.remove('hidden');
        }
    };
    // Inline editing for content
    templateContentContainer.onclick = () => {
        if (!isEditingTemplate) {
            templateContentInput.value = currentTemplate ? currentTemplate.content : '';
            templateContentContainer.classList.add('hidden');
            templateContentInput.classList.remove('hidden');
            templateContentInput.focus();
            isEditingTemplate = true;
            templateEditActions.classList.remove('hidden');
        }
    };
    templateContentInput.onblur = () => {
        if (isEditingTemplate) {
            templateContentInput.classList.add('hidden');
            templateContentContainer.classList.remove('hidden');
        }
    };

    // Save/Cancel logic
    saveTemplateBtn.onclick = async () => {
        const name = templateTitleInput.value.trim() || templateTitle.textContent.trim();
        const content = templateContentInput.value.trim() || templateContentContainer.innerHTML.trim();
        if (!name || !content) {
            alert('Please enter both title and content.');
            return;
        }
        if (isAddingTemplate) {
            // Add new
            const res = await fetch('/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, content })
            });
            if (res.ok) {
                await fetchTemplates();
                backToListBtn.click();
            }
        } else if (currentTemplate) {
            // Update existing
            const res = await fetch('/api/templates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: currentTemplate.id, name, content })
            });
            if (res.ok) {
                await fetchTemplates();
                backToListBtn.click();
            }
        }
    };
    cancelTemplateBtn.onclick = () => {
        backToListBtn.click();
    };

    backToListBtn.onclick = () => {
        templateContentView.classList.add('hidden');
        templateListView.classList.remove('hidden');
        templateContentContainer.innerHTML = '';
        templateTitle.textContent = '';
        templateTitleInput.value = '';
        templateContentInput.value = '';
        isEditingTemplate = false;
        isAddingTemplate = false;
        currentTemplate = null;
        selectedTemplateId = null;
    };

    // Initial Load
    getFeedbackNotes();
    fetchTemplates();
}); 
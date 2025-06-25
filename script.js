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
    
    // Feedback Modal Elements
    const feedbackModal = document.getElementById('feedback-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalText = document.getElementById('modal-text');
    const modalImage = document.getElementById('modal-image');
    const modalEditInput = document.getElementById('modal-edit-input');
    const modalEditBtn = document.getElementById('modal-edit-btn');
    const modalDeleteBtn = document.getElementById('modal-delete-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');

    // Library & Prompt Builder Elements
    const libraryItems = document.querySelectorAll('.library-item');
    const promptBuilderContainer = document.getElementById('prompt-builder-container');

    // Dropdown Editor Modal Elements
    const dropdownEditorModal = document.getElementById('dropdown-editor-modal');
    const dropdownModalCloseBtn = document.getElementById('dropdown-modal-close-btn');
    const dropdownTextInput = document.getElementById('dropdown-text-input');
    const dropdownOptionsContainer = document.getElementById('dropdown-options-container');
    const addDropdownOptionBtn = document.getElementById('add-dropdown-option-btn');
    const dropdownModalDeleteBtn = document.getElementById('dropdown-modal-delete-btn');
    const dropdownModalSaveBtn = document.getElementById('dropdown-modal-save-btn');

    let activeNoteElement = null;
    let activePromptElement = null; // To keep track of the element being edited
    let originalText = '';
    let currentFile = null;

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

    // --- Prompt Element Data Functions ---
    async function getPromptElements() {
        const response = await fetch('/api/prompt-elements');
        if (!response.ok) {
            console.error('Failed to fetch prompt elements');
            return;
        }
        const elements = await response.json();
        promptBuilderContainer.innerHTML = '';
        elements.sort((a, b) => a.order - b.order).forEach(el => createPromptElement(el));
    }

    async function addPromptElement(type) {
        let defaultElement = {};
        if (type === 'dropdown') {
            defaultElement = {
                type: 'dropdown',
                text: 'Please select an option: {{dropdown}}',
                options: ['Option 1', 'Option 2'],
                order: promptBuilderContainer.children.length
            };
        } else {
            return; // Only handle dropdowns for now
        }

        const response = await fetch('/api/prompt-elements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(defaultElement),
        });
        if (!response.ok) {
            console.error('Failed to add prompt element');
            return;
        }
        const newElement = await response.json();
        createPromptElement(newElement);
    }
    
    async function updatePromptElement(id, text, options) {
        const order = Array.from(promptBuilderContainer.children).findIndex(child => child.dataset.id === id);
        const response = await fetch('/api/prompt-elements', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, text, options, order }),
        });
         if (!response.ok) {
            console.error('Failed to update prompt element');
            return false;
        }
        return true;
    }

     async function deletePromptElement(id) {
        const response = await fetch('/api/prompt-elements', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (!response.ok) {
            console.error('Failed to delete prompt element');
            return false;
        }
        return true;
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

    function createPromptElement({ id, type, text, options }) {
        if (type !== 'dropdown') return;

        const element = document.createElement('div');
        element.className = 'prompt-element';
        element.dataset.id = id;

        // Re-create the inner HTML based on the text and options
        const textParts = text.split('{{dropdown}}');
        element.innerHTML = ''; // Clear previous content
        element.appendChild(document.createTextNode(textParts[0]));

        const select = document.createElement('select');
        options.forEach(optText => {
            const option = document.createElement('option');
            option.value = optText;
            option.textContent = optText;
            select.appendChild(option);
        });
        element.appendChild(select);
        element.appendChild(document.createTextNode(textParts[1] || ''));

        element.addEventListener('click', () => {
            openDropdownEditor(element, {id, type, text, options});
        });

        promptBuilderContainer.appendChild(element);
    }

    function resetForm() {
        feedbackInput.value = '';
        imageUploadInput.value = ''; // Reset file input
        currentFile = null;
        imagePreview.src = '';
        imagePreview.classList.add('hidden');
        removeImageBtn.classList.add('hidden');
        modalImage.classList.add('hidden');
        exitEditMode();
        modalOverlay.style.display = 'block';
        feedbackModal.style.display = 'block';
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

    // --- Dropdown Editor Modal Functions ---
    function openDropdownEditor(element, data) {
        activePromptElement = element;
        dropdownTextInput.value = data.text;
        
        // Populate options
        dropdownOptionsContainer.innerHTML = '';
        data.options.forEach(optionText => {
            createDropdownOptionInput(optionText);
        });

        modalOverlay.style.display = 'block';
        dropdownEditorModal.classList.remove('hidden');
    }

    function closeDropdownEditor() {
        dropdownEditorModal.classList.add('hidden');
        modalOverlay.style.display = 'none';
        activePromptElement = null;
    }
    
    function createDropdownOptionInput(value = '') {
        const item = document.createElement('div');
        item.className = 'dropdown-option-item';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.placeholder = 'Enter option text';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-option-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', () => item.remove());

        item.appendChild(input);
        item.appendChild(removeBtn);
        dropdownOptionsContainer.appendChild(item);
    }

    async function saveDropdownElement() {
        const id = activePromptElement.dataset.id;
        const text = dropdownTextInput.value;
        const options = Array.from(dropdownOptionsContainer.querySelectorAll('.dropdown-option-item input'))
                             .map(input => input.value.trim())
                             .filter(val => val); // Remove empty options

        if (!text || options.length === 0) {
            alert('Please provide text and at least one option.');
            return;
        }

        const success = await updatePromptElement(id, text, options);
        if (success) {
            // Re-render the element in the prompt builder
            createPromptElement({id, type: 'dropdown', text, options });
            activePromptElement.remove(); // Remove old one
            closeDropdownEditor();
        } else {
            alert('Failed to save element.');
        }
    }

    async function deleteActivePromptElement() {
        const id = activePromptElement.dataset.id;
        if (confirm('Are you sure you want to delete this element?')) {
            const success = await deletePromptElement(id);
            if (success) {
                activePromptElement.remove();
                closeDropdownEditor();
            } else {
                alert('Failed to delete element.');
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

    // --- Drag and Drop Listeners ---
    libraryItems.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', e.target.dataset.type);
        });
    });

    promptBuilderContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        promptBuilderContainer.classList.add('dragover');
    });

    promptBuilderContainer.addEventListener('dragleave', () => {
        promptBuilderContainer.classList.remove('dragover');
    });

    promptBuilderContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        promptBuilderContainer.classList.remove('dragover');
        const type = e.dataTransfer.getData('text/plain');
        addPromptElement(type);
    });

    // --- Dropdown Editor Listeners ---
    dropdownModalCloseBtn.addEventListener('click', closeDropdownEditor);
    addDropdownOptionBtn.addEventListener('click', () => createDropdownOptionInput());
    dropdownModalSaveBtn.addEventListener('click', saveDropdownElement);
    dropdownModalDeleteBtn.addEventListener('click', deleteActivePromptElement);

    // Initial Load
    getFeedbackNotes();
    getPromptElements();
}); 
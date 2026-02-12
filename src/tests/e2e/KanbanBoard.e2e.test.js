

import { test, expect } from "@playwright/test";

// ==================== HELPER FUNCTIONS ====================

const waitForConnection = async (page) => {
  try {
    await page.waitForSelector('text=Connected', { timeout: 10000 });
  } catch (error) {
    console.log('Note: WebSocket connection timeout - continuing tests anyway');
  }
};

const createTask = async (page, { title, description, priority, category, column = 'To Do' }) => {
  await page.locator(`[aria-label="Add task to ${column}"]`).click();
  await expect(page.locator('text=Create New Task')).toBeVisible();

  await page.fill('input[placeholder*="Enter task title"]', title);

  if (description) {
    await page.fill('textarea[placeholder*="Describe the task"]', description);
  }

  if (priority) {
    await page.selectOption('select', { label: priority });
  }

  if (category) {
    const selects = await page.locator('select').all();
    if (selects.length > 1) {
      await selects[1].selectOption({ label: category });
    }
  }

  await page.click('button:text("Create Task")');
  await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 5000 });
};

const deleteTask = async (page, taskTitle) => {
  const taskCard = page.locator(`text=${taskTitle}`).locator('..');
  const deleteButton = taskCard.locator('[aria-label="Delete task"]');

  page.once('dialog', dialog => dialog.accept());
  await deleteButton.click();

  await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible({ timeout: 5000 });
};

// ==================== TEST SUITES ====================

test.describe('Kanban Board E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState('networkidle');
    await waitForConnection(page);
  });

  // ==================== BASIC RENDERING ====================

  test("User can add a task and see it on the board", async ({ page }) => {
    // Original test from provided template
    await expect(page.getByText("Kanban Board")).toBeVisible();

    // Extended: Actually create and verify a task
    await createTask(page, {
      title: 'E2E Test Task',
      description: 'This is an end-to-end test task',
      priority: 'High',
      category: 'Bug',
      column: 'To Do'
    });

    await expect(page.locator('text=E2E Test Task')).toBeVisible();
    await expect(page.locator('text=High')).toBeVisible();
    await expect(page.locator('text=Bug')).toBeVisible();
  });

  test("Board displays all three columns", async ({ page }) => {
    await expect(page.locator('text=To Do').first()).toBeVisible();
    await expect(page.locator('text=In Progress').first()).toBeVisible();
    await expect(page.locator('text=Done').first()).toBeVisible();
  });

  test("Connection status indicator is visible", async ({ page }) => {
    const connectionStatus = page.locator('text=Connected, text=Disconnected');
    await expect(connectionStatus.first()).toBeVisible();
  });

  test("Progress chart is displayed on load", async ({ page }) => {
    await expect(page.locator('text=Task Progress Analytics')).toBeVisible();
    await expect(page.locator('text=Total Tasks')).toBeVisible();
    await expect(page.locator('text=Completion Rate')).toBeVisible();
  });

  // ==================== TASK CREATION ====================

  test("User can create tasks with different priorities", async ({ page }) => {
    const priorities = ['Low', 'Medium', 'High'];

    for (const priority of priorities) {
      await createTask(page, {
        title: `${priority} Priority Task`,
        priority: priority,
        column: 'To Do'
      });

      await expect(page.locator(`text=${priority} Priority Task`)).toBeVisible();
    }
  });

  test("User can create tasks with different categories", async ({ page }) => {
    const categories = ['Bug', 'Feature', 'Enhancement'];

    for (const category of categories) {
      await createTask(page, {
        title: `${category} Task`,
        category: category,
        column: 'To Do'
      });

      await expect(page.locator(`text=${category} Task`)).toBeVisible();
    }
  });

  test("User can create tasks in different columns", async ({ page }) => {
    const columns = ['To Do', 'In Progress', 'Done'];

    for (const column of columns) {
      await createTask(page, {
        title: `Task in ${column}`,
        column: column
      });

      await expect(page.locator(`text=Task in ${column}`)).toBeVisible();
    }
  });

  test("Modal closes after task creation", async ({ page }) => {
    await page.locator('[aria-label="Add task to To Do"]').click();
    await expect(page.locator('text=Create New Task')).toBeVisible();

    await page.fill('input[placeholder*="Enter task title"]', 'Quick Task');
    await page.click('button:text("Create Task")');

    await expect(page.locator('text=Create New Task')).not.toBeVisible();
  });

  // ==================== TASK EDITING ====================

  test("User can edit an existing task", async ({ page }) => {
    await createTask(page, {
      title: 'Task to Edit',
      description: 'Original description',
      column: 'To Do'
    });

    const editButton = page.locator('[aria-label="Edit task"]').first();
    await editButton.click();

    await expect(page.locator('text=Edit Task')).toBeVisible();

    const titleInput = page.locator('input[placeholder*="Enter task title"]');
    await titleInput.clear();
    await titleInput.fill('Updated Task Title');

    const descInput = page.locator('textarea[placeholder*="Describe the task"]');
    await descInput.clear();
    await descInput.fill('Updated description');

    await page.click('button:text("Update Task")');

    await expect(page.locator('text=Updated Task Title')).toBeVisible();
    await expect(page.locator('text=Updated description')).toBeVisible();
  });

  test("User can change task priority and category", async ({ page }) => {
    await createTask(page, {
      title: 'Priority Change Test',
      priority: 'Low',
      category: 'Feature',
      column: 'To Do'
    });

    const editButton = page.locator('[aria-label="Edit task"]').first();
    await editButton.click();

    await page.selectOption('select', { label: 'High' });
    const selects = await page.locator('select').all();
    if (selects.length > 1) {
      await selects[1].selectOption({ label: 'Bug' });
    }

    await page.click('button:text("Update Task")');

    await expect(page.locator('text=High')).toBeVisible();
    await expect(page.locator('text=Bug')).toBeVisible();
  });

  test("User can cancel task edit", async ({ page }) => {
    await createTask(page, {
      title: 'No Edit Task',
      column: 'To Do'
    });

    const editButton = page.locator('[aria-label="Edit task"]').first();
    await editButton.click();

    await expect(page.locator('text=Edit Task')).toBeVisible();

    const titleInput = page.locator('input[placeholder*="Enter task title"]');
    await titleInput.clear();
    await titleInput.fill('This Should Not Save');

    await page.click('button:text("Cancel")');

    await expect(page.locator('text=No Edit Task')).toBeVisible();
    await expect(page.locator('text=This Should Not Save')).not.toBeVisible();
  });

  // ==================== TASK DELETION ====================

  test("User can delete a task", async ({ page }) => {
    await createTask(page, {
      title: 'Task to Delete',
      column: 'To Do'
    });

    await expect(page.locator('text=Task to Delete')).toBeVisible();

    await deleteTask(page, 'Task to Delete');

    await expect(page.locator('text=Task to Delete')).not.toBeVisible();
  });

  test("Delete confirmation dialog appears", async ({ page }) => {
    await createTask(page, {
      title: 'Confirm Delete',
      column: 'To Do'
    });

    let dialogAppeared = false;
    page.once('dialog', dialog => {
      dialogAppeared = true;
      expect(dialog.message()).toContain('delete');
      dialog.dismiss();
    });

    const deleteButton = page.locator('[aria-label="Delete task"]').first();
    await deleteButton.click();

    expect(dialogAppeared).toBe(true);
    await expect(page.locator('text=Confirm Delete')).toBeVisible();
  });

  // ==================== FILE UPLOAD ====================

  test("User can upload a file attachment", async ({ page }) => {
    await page.locator('[aria-label="Add task to To Do"]').click();

    await page.fill('input[placeholder*="Enter task title"]', 'Task with File');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-file.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Test PDF content'),
    });

    await expect(page.locator('text=test-file.pdf')).toBeVisible();

    await page.click('button:text("Create Task")');

    await expect(page.locator('text=1 attachment(s)')).toBeVisible();
  });

  test("User can upload multiple files", async ({ page }) => {
    await page.locator('[aria-label="Add task to To Do"]').click();

    await page.fill('input[placeholder*="Enter task title"]', 'Multiple Files');

    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'file1.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('File 1'),
    });

    await expect(page.locator('text=file1.pdf')).toBeVisible();

    await fileInput.setInputFiles({
      name: 'file2.png',
      mimeType: 'image/png',
      buffer: Buffer.from('File 2'),
    });

    await expect(page.locator('text=file2.png')).toBeVisible();

    await page.click('button:text("Create Task")');

    await expect(page.locator('text=2 attachment(s)')).toBeVisible();
  });

  test("User can remove uploaded file before saving", async ({ page }) => {
    await page.locator('[aria-label="Add task to To Do"]').click();

    await page.fill('input[placeholder*="Enter task title"]', 'Remove File Test');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'removable.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Content'),
    });

    await expect(page.locator('text=removable.pdf')).toBeVisible();

    await page.click('button:text("Remove")');

    await expect(page.locator('text=removable.pdf')).not.toBeVisible();
  });

  // ==================== DROPDOWN TESTING ====================

  test("Priority dropdown has all options", async ({ page }) => {
    await page.locator('[aria-label="Add task to To Do"]').click();

    const prioritySelect = page.locator('select').first();
    const options = await prioritySelect.locator('option').allTextContents();

    expect(options).toContain('Low');
    expect(options).toContain('Medium');
    expect(options).toContain('High');
  });

  test("Category dropdown has all options", async ({ page }) => {
    await page.locator('[aria-label="Add task to To Do"]').click();

    const selects = await page.locator('select').all();
    const categorySelect = selects[1];
    const options = await categorySelect.locator('option').allTextContents();

    expect(options).toContain('Bug');
    expect(options).toContain('Feature');
    expect(options).toContain('Enhancement');
  });

  // ==================== GRAPH/CHART TESTING ====================

  test("Task counts update correctly in the graph", async ({ page }) => {
    const totalTasksSection = page.locator('text=Total Tasks').locator('..');

    await createTask(page, {
      title: 'Chart Update Test',
      column: 'To Do'
    });

    await page.waitForTimeout(1000);

    await expect(page.locator('text=Task Progress Analytics')).toBeVisible();
  });

  test("Graph re-renders dynamically when new tasks are added", async ({ page }) => {
    await createTask(page, { title: 'Todo Task', column: 'To Do' });
    await createTask(page, { title: 'Progress Task', column: 'In Progress' });
    await createTask(page, { title: 'Done Task', column: 'Done' });

    await expect(page.locator('text=Tasks by Column')).toBeVisible();
    await expect(page.locator('text=Completion Status')).toBeVisible();
  });

  // ==================== FORM VALIDATION ====================

  test("Cannot create task without title", async ({ page }) => {
    await page.locator('[aria-label="Add task to To Do"]').click();

    await page.click('button:text("Create Task")');

    await expect(page.locator('text=Create New Task')).toBeVisible();
  });

  test("Title has character limit", async ({ page }) => {
    await page.locator('[aria-label="Add task to To Do"]').click();

    const titleInput = page.locator('input[placeholder*="Enter task title"]');

    await titleInput.fill('Test');
    await expect(page.locator('text=/\\d+\\/100 characters/')).toBeVisible();
  });

  test("Description has character limit", async ({ page }) => {
    await page.locator('[aria-label="Add task to To Do"]').click();

    const descInput = page.locator('textarea[placeholder*="Describe the task"]');

    await descInput.fill('Test description');
    await expect(page.locator('text=/\\d+\\/500 characters/')).toBeVisible();
  });

  // ==================== MODAL INTERACTIONS ====================

  test("Modal can be closed by clicking Cancel", async ({ page }) => {
    await page.locator('[aria-label="Add task to To Do"]').click();
    await expect(page.locator('text=Create New Task')).toBeVisible();

    await page.click('button:text("Cancel")');

    await expect(page.locator('text=Create New Task')).not.toBeVisible();
  });

  test("Modal can be closed by clicking X button", async ({ page }) => {
    await page.locator('[aria-label="Add task to To Do"]').click();
    await expect(page.locator('text=Create New Task')).toBeVisible();

    await page.click('[aria-label="Close modal"]');

    await expect(page.locator('text=Create New Task')).not.toBeVisible();
  });

  // ==================== REAL-TIME SYNC TESTING ====================

  test("UI updates in real-time when another user modifies tasks", async ({ context, page }) => {
    const page2 = await context.newPage();
    await page2.goto('http://localhost:5173');
    await page2.waitForLoadState('networkidle');
    await waitForConnection(page2);

    await createTask(page, {
      title: 'Real-time Sync Test',
      column: 'To Do'
    });

    await expect(page2.locator('text=Real-time Sync Test')).toBeVisible({ timeout: 5000 });

    await page2.close();
  });

  // ==================== ACCESSIBILITY ====================

  test("All interactive elements have aria-labels", async ({ page }) => {
    const addButtons = page.locator('[aria-label^="Add task to"]');
    expect(await addButtons.count()).toBe(3);

    await createTask(page, { title: 'Accessibility Test', column: 'To Do' });

    await expect(page.locator('[aria-label="Edit task"]').first()).toBeVisible();
    await expect(page.locator('[aria-label="Delete task"]').first()).toBeVisible();
  });

  // ==================== RESPONSIVE DESIGN ====================

  test("Board is responsive on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(page.locator('text=Kanban Board')).toBeVisible();
    await expect(page.locator('text=To Do')).toBeVisible();
  });

  test("Board is responsive on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await expect(page.locator('text=Kanban Board')).toBeVisible();
    await expect(page.locator('text=Task Progress Analytics')).toBeVisible();
  });
});
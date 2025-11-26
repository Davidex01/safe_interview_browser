// src/pages/Hr/HrWorkshopPage.jsx
import React, { useState } from "react";
import Container from "../../components/ui/Container.jsx";
import Button from "../../components/ui/Button.jsx";

const TOPICS = [
  { id: "algorithms", label: "Алгоритмы" },
  { id: "math", label: "Математика" },
  { id: "sql", label: "SQL" },
  { id: "product", label: "Продуктовые" },
];

const DIFFICULTIES = [
  { value: "easy", label: "Лёгкие" },
  { value: "medium", label: "Средние" },
  { value: "hard", label: "Сложные" },
];

const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "Go",
  "SQL",
];

function createCanvasNode(topicId, topicLabel, defaults = {}) {
  return {
    id: `${topicId}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`,
    topicId,
    topicLabel,
    difficulty: defaults.difficulty || "",
    language: defaults.language || "",
  };
}

function HrWorkshopPage() {
  const [canvasNodes, setCanvasNodes] = useState([]);

  const [topicConfigs, setTopicConfigs] = useState(() => {
    const initial = {};
    TOPICS.forEach((t) => {
      initial[t.id] = { difficulty: "", language: "" };
    });
    return initial;
  });

  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleChangeTopicDifficulty = (topicId, difficulty) => {
    setTopicConfigs((prev) => ({
      ...prev,
      [topicId]: { ...prev[topicId], difficulty },
    }));
  };

  const handleChangeTopicLanguage = (topicId, language) => {
    setTopicConfigs((prev) => ({
      ...prev,
      [topicId]: { ...prev[topicId], language },
    }));
  };

  const handleAddNodeToCanvas = (topicId, topicLabel) => {
    const cfg = topicConfigs[topicId] || {};
    const node = createCanvasNode(topicId, topicLabel, cfg);
    setCanvasNodes((prev) => [...prev, node]);
  };

  const handleCanvasNodeChange = (nodeId, updates) => {
    setCanvasNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))
    );
  };

  const handleDeleteNode = (nodeId) => {
    setCanvasNodes((prev) => prev.filter((n) => n.id !== nodeId));
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, overIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === overIndex) return;

    setCanvasNodes((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedIndex, 1);
      updated.splice(overIndex, 0, moved);
      return updated;
    });
    setDraggedIndex(overIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    console.log("Canvas nodes:", canvasNodes);
  };

  return (
    <section className="hr-workshop">
      <div className="hr-workshop__wrapper">
        <Container className="hr-workshop__layout">
          {/* ЛЕВАЯ ЧАСТЬ — ПОЛОТНО */}
          <div className="hr-workshop__canvas-column">
            <header className="hr-workshop__header">
              <h1>Мастерская собеседований</h1>
              <p>
                Слева — полотно сценария интервью. Добавляйте блоки задач из
                панели справа, настраивайте их сложность и язык. Блоки можно
                перетаскивать и удалять.
              </p>
            </header>

            <div className="hr-workshop__canvas">
              {canvasNodes.length === 0 ? (
                <div className="hr-workshop__canvas-empty">
                  Добавьте блоки из панели задач справа, чтобы собрать сценарий
                  интервью.
                </div>
              ) : (
                <div className="hr-workshop__canvas-row">
                  {canvasNodes.map((node, index) => (
                    <CanvasNodeBlock
                      key={node.id}
                      node={node}
                      index={index}
                      onChange={handleCanvasNodeChange}
                      onDelete={handleDeleteNode}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="hr-workshop__canvas-actions">
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={canvasNodes.length === 0}
              >
                Сохранить сценарий
              </Button>
            </div>
          </div>

          {/* ПРАВАЯ ПАНЕЛЬ — ПРИЖАТА К ПРАВОМУ КРАЮ */}
          <aside className="hr-workshop__palette-column">
            <form
              className="hr-workshop__topics-form"
              onSubmit={(e) => e.preventDefault()}
            >
              <h2 className="hr-workshop__palette-title">Панель задач</h2>
              <p className="hr-workshop__palette-subtitle">
                Настройте параметры для тем и добавляйте блоки на полотно.
              </p>

              {TOPICS.map((topic) => {
                const cfg = topicConfigs[topic.id];
                return (
                  <div key={topic.id} className="hr-workshop__topic-block">
                    <div className="hr-workshop__topic-header">
                      <h3 className="hr-workshop__topic-title">
                        {topic.label}
                      </h3>
                      <Button
                        type="button"
                        variant="secondary"
                        className="hr-workshop__topic-add"
                        onClick={() =>
                          handleAddNodeToCanvas(topic.id, topic.label)
                        }
                      >
                        Добавить
                      </Button>
                    </div>

                    <div className="hr-workshop__topic-field">
                      <label htmlFor={`${topic.id}-difficulty`}>
                        Сложность по умолчанию
                      </label>
                      <select
                        id={`${topic.id}-difficulty`}
                        value={cfg.difficulty}
                        onChange={(e) =>
                          handleChangeTopicDifficulty(topic.id, e.target.value)
                        }
                      >
                        <option value="">Не выбрано</option>
                        {DIFFICULTIES.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="hr-workshop__topic-field">
                      <label htmlFor={`${topic.id}-language`}>
                        Язык по умолчанию
                      </label>
                      <select
                        id={`${topic.id}-language`}
                        value={cfg.language}
                        onChange={(e) =>
                          handleChangeTopicLanguage(topic.id, e.target.value)
                        }
                      >
                        <option value="">Не выбран</option>
                        {LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </form>
          </aside>
        </Container>
      </div>
    </section>
  );
}

function CanvasNodeBlock({
  node,
  index,
  onChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
}) {
  const handleDiffChange = (e) => {
    onChange(node.id, { difficulty: e.target.value });
  };

  const handleLangChange = (e) => {
    onChange(node.id, { language: e.target.value });
  };

  const handleDeleteClick = () => {
    onDelete(node.id);
  };

  const handleDragStartLocal = () => {
    onDragStart(index);
  };

  const handleDragOverLocal = (e) => {
    onDragOver(e, index);
  };

  return (
    <div
      className="hr-workshop__canvas-node"
      draggable
      onDragStart={handleDragStartLocal}
      onDragOver={handleDragOverLocal}
      onDragEnd={onDragEnd}
    >
      <div className="hr-workshop__canvas-node-header">
        <span className="hr-workshop__canvas-node-title">
          {node.topicLabel}
        </span>
        <button
          type="button"
          className="hr-workshop__canvas-node-delete"
          onClick={handleDeleteClick}
          aria-label="Удалить блок"
        >
          ×
        </button>
      </div>
      <div className="hr-workshop__canvas-node-body">
        <div className="hr-workshop__canvas-node-field">
          <label>Сложность</label>
          <select value={node.difficulty} onChange={handleDiffChange}>
            <option value="">Не выбрано</option>
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="hr-workshop__canvas-node-field">
          <label>Язык</label>
          <select value={node.language} onChange={handleLangChange}>
            <option value="">Не выбран</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default HrWorkshopPage;
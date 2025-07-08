document.addEventListener('DOMContentLoaded', function () {
  loadConfig()

  const form = document.getElementById('configForm')
  form.addEventListener('submit', saveConfig)
})

async function loadConfig() {
  const loading = document.getElementById('loading')
  const form = document.getElementById('configForm')
  const message = document.getElementById('message')

  try {
    loading.classList.remove('hidden')
    form.classList.add('hidden')
    message.classList.add('hidden')

    const response = await fetch('/api/config')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const config = await response.json()
    populateForm(config)

    loading.classList.add('hidden')
    form.classList.remove('hidden')
  } catch (error) {
    console.error('Ошибка загрузки конфига:', error)
    showMessage('Ошибка загрузки настроек: ' + error.message, 'error')
    loading.classList.add('hidden')
  }
}

function populateForm(config) {
  if (config.Telegram) {
    setFieldValue('api_id', config.Telegram.api_id || '')
    setFieldValue('api_hash', config.Telegram.api_hash || '')
    setFieldValue('phone_number', config.Telegram.phone_number || '')
    setFieldValue('channel_id', config.Telegram.channel_id || '')
  }

  if (config.Bot) {
    setFieldValue('interval', config.Bot.interval || '10')
    setFieldValue('language', config.Bot.language || 'RU')
  }

  if (config.Gifts) {
    parseGiftRanges(config.Gifts.gift_ranges || '')
    setCheckboxValue('purchase_only_upgradable_gifts', config.Gifts.purchase_only_upgradable_gifts === 'True')
    setCheckboxValue('prioritize_low_supply', config.Gifts.prioritize_low_supply === 'True')
  }
}

function setFieldValue(fieldId, value) {
  const field = document.getElementById(fieldId)
  if (field) {
    field.value = value
  }
}

function setCheckboxValue(fieldId, checked) {
  const field = document.getElementById(fieldId)
  if (field) {
    field.checked = checked
  }
}

async function saveConfig(event) {
  event.preventDefault()

  const form = document.getElementById('configForm')
  const submitBtn = form.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent

  try {
    submitBtn.textContent = '💾 Сохранение...'
    submitBtn.disabled = true

    const formData = new FormData(form)
    const config = buildConfigObject(formData)

    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    showMessage(result.message || 'Настройки успешно сохранены!', 'success')

    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    showMessage('Ошибка сохранения настроек: ' + error.message, 'error')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    submitBtn.textContent = originalText
    submitBtn.disabled = false
  }
}

function buildConfigObject(formData) {
  const config = {
    Telegram: {
      api_id: formData.get('api_id') || '',
      api_hash: formData.get('api_hash') || '',
      phone_number: formData.get('phone_number') || '',
      channel_id: formData.get('channel_id') || '',
    },
    Bot: {
      interval: formData.get('interval') || '10',
      language: formData.get('language') || 'RU',
    },
    Gifts: {
      gift_ranges: buildGiftRanges(),
      purchase_only_upgradable_gifts: formData.get('purchase_only_upgradable_gifts') ? 'True' : 'False',
      prioritize_low_supply: formData.get('prioritize_low_supply') ? 'True' : 'False',
    },
  }

  return config
}

function showMessage(text, type) {
  const message = document.getElementById('message')
  message.textContent = text
  message.className = `message ${type}`
  message.classList.remove('hidden')

  setTimeout(() => {
    message.classList.add('hidden')
  }, 5000)
}

document.addEventListener('DOMContentLoaded', function () {
  const apiIdField = document.getElementById('api_id')
  if (apiIdField) {
    apiIdField.addEventListener('input', function () {
      const value = this.value.trim()
      if (value) {
        const numValue = parseInt(value)
        if (numValue <= 0 || isNaN(numValue)) {
          this.setCustomValidity('API ID должен быть положительным числом')
        } else {
          this.setCustomValidity('')
        }
      } else {
        this.setCustomValidity('')
      }
    })
  }

  const phoneField = document.getElementById('phone_number')
  if (phoneField) {
    phoneField.addEventListener('input', function () {
      const value = this.value.trim()
      if (value && !value.match(/^\+?\d{10,15}$/)) {
        this.setCustomValidity('Введите корректный номер телефона')
      } else {
        this.setCustomValidity('')
      }
    })
  }

  const intervalField = document.getElementById('interval')
  if (intervalField) {
    intervalField.addEventListener('input', function () {
      const value = parseInt(this.value)
      if (value < 1 || value > 3600 || isNaN(value)) {
        this.setCustomValidity('Интервал должен быть от 1 до 3600 секунд')
      } else {
        this.setCustomValidity('')
      }
    })
  }
})

let giftRangeCounter = 1

function addGiftRange() {
  giftRangeCounter++
  const container = document.getElementById('giftRanges')

  const rangeDiv = document.createElement('div')
  rangeDiv.className = 'gift-range-item'
  rangeDiv.innerHTML = `
    <div class="range-header">
      <h4>Диапазон подарков #${giftRangeCounter}</h4>
      <button type="button" class="btn-remove" onclick="removeGiftRange(this)">❌</button>
    </div>
    
    <div class="range-fields">
      <div class="field-row">
        <div class="field-col">
          <label>Цена от (звезды):</label>
          <input type="number" class="range-min" min="1" value="1" required>
        </div>
        <div class="field-col">
          <label>Цена до (звезды):</label>
          <input type="number" class="range-max" min="1" value="100000" required>
        </div>
      </div>
      
      <div class="field-row">
        <div class="field-col">
          <label>Лимит тиража (supply):</label>
          <input type="number" class="range-supply" min="1" value="1000000" required>
          <div class="field-help">Покупать, если подарков в продаже меньше этого числа</div>
        </div>
        <div class="field-col">
          <label>Количество покупки:</label>
          <input type="number" class="range-quantity" min="1" value="10000" required>
          <div class="field-help">Сколько штук покупать</div>
        </div>
      </div>
      
      <div class="field-full">
        <label>Получатели:</label>
        <input type="text" class="range-recipients" placeholder="@username, @channel, 123456789" required>
        <div class="field-help">Укажите @username или ID через запятую</div>
      </div>
    </div>
  `

  container.appendChild(rangeDiv)
  updateRemoveButtons()
}

function removeGiftRange(button) {
  const rangeItem = button.closest('.gift-range-item')
  rangeItem.remove()
  updateRemoveButtons()
  updateRangeNumbers()
}

function updateRemoveButtons() {
  const ranges = document.querySelectorAll('.gift-range-item')
  ranges.forEach((range, index) => {
    const removeBtn = range.querySelector('.btn-remove')
    if (ranges.length > 1) {
      removeBtn.style.display = 'block'
    } else {
      removeBtn.style.display = 'none'
    }
  })
}

function updateRangeNumbers() {
  const ranges = document.querySelectorAll('.gift-range-item')
  ranges.forEach((range, index) => {
    const header = range.querySelector('.range-header h4')
    header.textContent = `Диапазон подарков #${index + 1}`
  })
}

function parseGiftRanges(giftRangesString) {
  const container = document.getElementById('giftRanges')
  container.innerHTML = ''
  giftRangeCounter = 0

  if (!giftRangesString.trim()) {
    addGiftRange()
    return
  }

  const ranges = giftRangesString.split(';')

  ranges.forEach(range => {
    const trimmed = range.trim()
    if (!trimmed) return

    try {
      const match = trimmed.match(/^(\d+)-(\d+):\s*(\d+)\s*[xX]\s*(\d+):\s*(.+)$/)
      if (match) {
        const [, minPrice, maxPrice, supply, quantity, recipients] = match

        giftRangeCounter++
        const rangeDiv = document.createElement('div')
        rangeDiv.className = 'gift-range-item'
        rangeDiv.innerHTML = `
          <div class="range-header">
            <h4>Диапазон подарков #${giftRangeCounter}</h4>
            <button type="button" class="btn-remove" onclick="removeGiftRange(this)">❌</button>
          </div>
          
          <div class="range-fields">
            <div class="field-row">
              <div class="field-col">
                <label>Цена от (звезды):</label>
                <input type="number" class="range-min" min="1" value="${minPrice}" required>
              </div>
              <div class="field-col">
                <label>Цена до (звезды):</label>
                <input type="number" class="range-max" min="1" value="${maxPrice}" required>
              </div>
            </div>
            
            <div class="field-row">
              <div class="field-col">
                <label>Лимит тиража (supply):</label>
                <input type="number" class="range-supply" min="1" value="${supply}" required>
                <div class="field-help">Покупать, если подарков в продаже меньше этого числа</div>
              </div>
              <div class="field-col">
                <label>Количество покупки:</label>
                <input type="number" class="range-quantity" min="1" value="${quantity}" required>
                <div class="field-help">Сколько штук покупать</div>
              </div>
            </div>
            
            <div class="field-full">
              <label>Получатели:</label>
              <input type="text" class="range-recipients" value="${recipients.replace(/"/g, '&quot;')}" required>
              <div class="field-help">Укажите @username или ID через запятую</div>
            </div>
          </div>
        `

        container.appendChild(rangeDiv)
      }
    } catch (e) {
      console.error('Error parsing range:', trimmed, e)
    }
  })

  if (container.children.length === 0) {
    addGiftRange()
  }

  updateRemoveButtons()
}

function buildGiftRanges() {
  const ranges = document.querySelectorAll('.gift-range-item')
  const giftRanges = []

  ranges.forEach(range => {
    const minPrice = range.querySelector('.range-min').value
    const maxPrice = range.querySelector('.range-max').value
    const supply = range.querySelector('.range-supply').value
    const quantity = range.querySelector('.range-quantity').value
    const recipients = range.querySelector('.range-recipients').value.trim()

    if (minPrice && maxPrice && supply && quantity && recipients) {
      giftRanges.push(`${minPrice}-${maxPrice}:${supply}x${quantity}:${recipients}`)
    }
  })

  return giftRanges.join(';')
}

window.loadConfig = loadConfig
window.addGiftRange = addGiftRange
window.removeGiftRange = removeGiftRange

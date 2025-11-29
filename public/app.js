// Aplicação Pokédex - Implementação com Código Limpo

// Constantes
const API_BASE_URL = 'https://pokeapi.co/api/v2';
const POKEMON_API = `${API_BASE_URL}/pokemon`;
const TYPE_API = `${API_BASE_URL}/type`;
const ITEMS_PER_PAGE = 20;
const MAX_POKEMON_BY_TYPE = 100;

// Estado da Aplicação
class PokemonState {
    constructor() {
        this.allPokemons = [];
        this.filteredPokemons = [];
        this.currentPage = 1;
        this.searchTerm = '';
        this.selectedType = '';
    }

    reset() {
        this.currentPage = 1;
        this.searchTerm = '';
        this.selectedType = '';
    }
}

const appState = new PokemonState();

// Elementos do DOM
const elements = {
    loadingContainer: () => document.getElementById('loadingContainer'),
    pokemonGrid: () => document.getElementById('pokemonGrid'),
    searchInput: () => document.getElementById('searchInput'),
    typeFilter: () => document.getElementById('typeFilter'),
    pageInfo: () => document.getElementById('pageInfo'),
    prevBtn: () => document.getElementById('prevBtn'),
    nextBtn: () => document.getElementById('nextBtn'),
    modalTitle: () => document.getElementById('modalTitle'),
    modalBody: () => document.getElementById('modalBody'),
    pokemonModal: () => document.getElementById('pokemonModal')
};

// Funções Utilitárias
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const showLoading = () => {
    elements.loadingContainer().style.display = 'flex';
    elements.pokemonGrid().style.display = 'none';
};

const hideLoading = () => {
    elements.loadingContainer().style.display = 'none';
    elements.pokemonGrid().style.display = 'flex';
};

const createSkeletonLoader = () => {
    const skeletons = Array.from({ length: ITEMS_PER_PAGE }, () => 
        '<div class="col-md-3"><div class="skeleton-card"></div></div>'
    ).join('');
    elements.loadingContainer().innerHTML = skeletons;
};

// Funções da API
const fetchData = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};

const loadPokemonTypes = async () => {
    try {
        const data = await fetchData(TYPE_API);
        const typeFilter = elements.typeFilter();
        
        data.results.forEach(type => {
            const option = document.createElement('option');
            option.value = type.name;
            option.textContent = capitalize(type.name);
            typeFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading types:', error);
    }
};

const loadPokemonPage = async () => {
    showLoading();
    
    try {
        const offset = (appState.currentPage - 1) * ITEMS_PER_PAGE;
        const url = `${POKEMON_API}?limit=${ITEMS_PER_PAGE}&offset=${offset}`;
        const data = await fetchData(url);
        
        const pokemonPromises = data.results.map(pokemon => fetchData(pokemon.url));
        const pokemonDetails = await Promise.all(pokemonPromises);
        
        appState.allPokemons = pokemonDetails;
        appState.filteredPokemons = [...pokemonDetails];
        
        renderPokemonGrid();
    } catch (error) {
        console.error('Error loading Pokemon page:', error);
        alert('Erro ao carregar Pokémons!');
    }
};

const loadPokemonByType = async (typeName) => {
    showLoading();
    
    try {
        const data = await fetchData(`${TYPE_API}/${typeName}`);
        const pokemonList = data.pokemon.slice(0, MAX_POKEMON_BY_TYPE);
        
        const pokemonPromises = pokemonList.map(item => fetchData(item.pokemon.url));
        const pokemonDetails = await Promise.all(pokemonPromises);
        
        appState.allPokemons = pokemonDetails;
        appState.filteredPokemons = [...pokemonDetails];
        
        renderPokemonGrid();
    } catch (error) {
        console.error('Error loading Pokemon by type:', error);
        alert('Erro ao carregar Pokémons do tipo!');
    }
};

// Funções de Renderização
const createPokemonCard = (pokemon) => {
    const types = pokemon.types.map(type => 
        `<span class="badge type-${type.type.name}">${capitalize(type.type.name)}</span>`
    ).join(' ');

    const imageUrl = pokemon.sprites.front_default || 'https://via.placeholder.com/120x120?text=No+Image';

    return `
        <div class="col-md-3">
            <div class="pokemon-card" onclick="showPokemonDetails(${pokemon.id})" role="gridcell" tabindex="0" onkeypress="handleCardKeyPress(event, ${pokemon.id})">
                <img src="${imageUrl}" class="pokemon-image" alt="Imagem do ${capitalize(pokemon.name)}" loading="lazy">
                <h5 class="text-center pokemon-name">#${pokemon.id.toString().padStart(3, '0')} ${capitalize(pokemon.name)}</h5>
                <div class="text-center pokemon-types">
                    ${types}
                </div>
            </div>
        </div>
    `;
};

const renderPokemonGrid = () => {
    const grid = elements.pokemonGrid();
    
    if (appState.filteredPokemons.length === 0) {
        grid.innerHTML = `
            <div class="col-12 empty-state">
                <h3>🔍 Nenhum Pokémon encontrado</h3>
                <p>Tente ajustar os filtros de busca ou limpar os filtros para ver todos os Pokémons.</p>
                <button class="btn btn-danger" onclick="clearFilters()">Limpar Filtros</button>
            </div>
        `;
    } else {
        const pokemonCards = appState.filteredPokemons.map(createPokemonCard).join('');
        grid.innerHTML = pokemonCards;
    }
    
    updatePaginationInfo();
    hideLoading();
};

const updatePaginationInfo = () => {
    const pageInfo = elements.pageInfo();
    const prevBtn = elements.prevBtn();
    const nextBtn = elements.nextBtn();
    
    if (appState.selectedType) {
        pageInfo.textContent = `Mostrando ${appState.filteredPokemons.length} pokémons`;
        prevBtn.disabled = true;
        nextBtn.disabled = true;
    } else {
        pageInfo.textContent = `Página ${appState.currentPage}`;
        prevBtn.disabled = appState.currentPage === 1;
        nextBtn.disabled = false;
    }
};

// Funções de Filtro
const applyFilters = () => {
    let filtered = [...appState.allPokemons];
    
    if (appState.searchTerm) {
        filtered = filtered.filter(pokemon => 
            pokemon.name.toLowerCase().includes(appState.searchTerm.toLowerCase()) ||
            pokemon.id.toString().includes(appState.searchTerm)
        );
    }
    
    appState.filteredPokemons = filtered;
    renderPokemonGrid();
};

// Manipuladores de Eventos
const filterPokemons = async () => {
    appState.searchTerm = elements.searchInput().value;
    appState.selectedType = elements.typeFilter().value;
    
    if (appState.selectedType) {
        await loadPokemonByType(appState.selectedType);
    } else {
        applyFilters();
    }
};

const clearFilters = () => {
    elements.searchInput().value = '';
    elements.typeFilter().value = '';
    appState.reset();
    loadPokemonPage();
};

const previousPage = () => {
    if (appState.currentPage > 1 && !appState.selectedType) {
        appState.currentPage--;
        loadPokemonPage();
    }
};

const nextPage = () => {
    if (!appState.selectedType) {
        appState.currentPage++;
        loadPokemonPage();
    }
};

const toggleTheme = () => {
    document.body.classList.toggle('dark-theme');
};

// Modal de Detalhes do Pokémon
const showPokemonDetails = async (pokemonId) => {
    try {
        const pokemon = await fetchData(`${POKEMON_API}/${pokemonId}`);
        const species = await fetchData(pokemon.species.url);
        
        const description = getEnglishDescription(species.flavor_text_entries);
        const modalContent = createModalContent(pokemon, description);
        
        elements.modalTitle().textContent = `#${pokemon.id} ${capitalize(pokemon.name)}`;
        elements.modalBody().innerHTML = modalContent;
        
        const modal = new bootstrap.Modal(elements.pokemonModal());
        modal.show();
    } catch (error) {
        console.error('Error loading Pokemon details:', error);
        alert('Erro ao carregar detalhes do Pokémon!');
    }
};

const getEnglishDescription = (flavorTextEntries) => {
    const englishEntry = flavorTextEntries.find(entry => entry.language.name === 'en');
    return englishEntry ? englishEntry.flavor_text.replace(/\\f/g, ' ') : 'Descrição não disponível.';
};

const createModalContent = (pokemon, description) => {
    const types = pokemon.types.map(type => 
        `<span class="badge type-${type.type.name}">${capitalize(type.type.name)}</span>`
    ).join(' ');
    
    const abilities = pokemon.abilities.map(ability => 
        capitalize(ability.ability.name)
    ).join(', ');
    
    const stats = pokemon.stats.map(stat => {
        const percentage = (stat.base_stat / 255) * 100;
        return `
            <div class="stat-item">
                <small>${capitalize(stat.stat.name)}: ${stat.base_stat}</small>
                <div class="stat-bar">
                    <div class="stat-fill" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="row">
            <div class="col-md-6">
                <div class="sprite-container">
                    <div class="sprite-item">
                        <img src="${pokemon.sprites.front_default}" alt="Normal">
                        <p class="text-center">Normal</p>
                    </div>
                    <div class="sprite-item">
                        <img src="${pokemon.sprites.front_shiny}" alt="Shiny">
                        <p class="text-center">Shiny</p>
                    </div>
                </div>
                
                <div class="pokemon-info">
                    <p><strong>Tipo:</strong> ${types}</p>
                    <p><strong>Altura:</strong> ${(pokemon.height / 10).toFixed(1)} m</p>
                    <p><strong>Peso:</strong> ${(pokemon.weight / 10).toFixed(1)} kg</p>
                    <p><strong>Habilidades:</strong> ${abilities}</p>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="pokemon-description">
                    <p><strong>Descrição:</strong></p>
                    <p>${description}</p>
                </div>
                
                <div class="pokemon-stats">
                    <h6>Estatísticas:</h6>
                    ${stats}
                </div>
            </div>
        </div>
    `;
};

// Manipuladores de Eventos Adicionais
const handleCardKeyPress = (event, pokemonId) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showPokemonDetails(pokemonId);
    }
};

// Função debounce para busca
let searchTimeout;
const debouncedFilter = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterPokemons, 300);
};

// Atualizar entrada de busca para usar filtro com debounce
const initializeEventListeners = () => {
    const searchInput = elements.searchInput();
    if (searchInput) {
        searchInput.removeAttribute('onkeyup');
        searchInput.addEventListener('input', debouncedFilter);
    }
};

// Inicialização da Aplicação
const initializeApp = async () => {
    try {
        createSkeletonLoader();
        await loadPokemonTypes();
        await loadPokemonPage();
        initializeEventListeners();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        const grid = elements.pokemonGrid();
        grid.innerHTML = `
            <div class="col-12 empty-state">
                <h3>❌ Erro ao carregar</h3>
                <p>Não foi possível carregar os dados. Verifique sua conexão e tente novamente.</p>
                <button class="btn btn-danger" onclick="location.reload()">Recarregar Página</button>
            </div>
        `;
        hideLoading();
    }
};

// Ouvintes de Eventos
window.addEventListener('load', initializeApp);

// Registro do Service Worker para melhor performance (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service worker pode ser adicionado depois para cache
    });
}
import {
    observer,
} from 'mobx-react';
import * as React from 'react';
import styled, {
    ThemeProvider,
} from '../util/styled';

import {
    themeStore,
} from '../theme';

import {
    WideButton,
} from '../common/button';
import {
    showConfirmDialog,
    showMessageDialog,
} from '../dialog';
import {
    CastingDefinition,
    LabeledGroup,
    RoleCategoryDefinition,
    RuleGroup,
} from '../defs';
import {
    bind,
} from '../util/bind';
import {
    SelectLabeledGroup,
    IPropSelectLabeledGroup,
} from '../util/labeled-group';
import {
    ReactCtor,
} from '../util/react-type';

import {
    JobsString,
    PlayerNumberError,
} from './jobs-string';
import {
    gameStart,
} from './logic/index';
import {
    RuleControl,
} from './rule-control';
import {
    SelectRoles,
} from './select-roles';
import {
    CastingStore,
} from './store';

import {
    i18n,
    I18n,
} from '../i18n';

const StatusLine = styled.div`
    position: sticky;
    top: 0;

    padding: 0.3em;
    background-color: ${props=> props.theme.bg_day || 'transparent'};
`;

interface IPropCasting {
    /**
     * i18n instance.
     */
    i18n: i18n,
    /**
     * store.
     */
    store: CastingStore;
    /**
     * Id of roles.
     */
    roles: string[];
    /**
     * Definition of castings.
     */
    castings: LabeledGroup<CastingDefinition, string>;
    /**
     * Definition of categories.
     */
    categories: RoleCategoryDefinition[];
    /**
     * Definition of rules.
     */
    ruledefs: RuleGroup;
    /**
     * Event of pressing gamestart button.
     */
    onStart: (query: Record<string, string>)=> void;
}

@observer
export class Casting extends React.Component<IPropCasting, {}> {
    public render(){
        const {
            i18n,
            store,
            roles,
            castings,
            categories,
            ruledefs,
        } = this.props;
        const {
            playersNumber,
            currentCasting,
            jobNumbers,
            jobInclusions,
            categoryNumbers,
            ruleObject,
        } = store;

        // Check whether current number of players is admissible.
        const {
            min = undefined,
            max = undefined,
        } = currentCasting.suggestedPlayersNumber || {};
        const minReq = Math.max(min || -Infinity, store.requiredPlayersNumber);
            
        // Specialized generic component.
        const SLG: ReactCtor<IPropSelectLabeledGroup<CastingDefinition, string>, {}> = SelectLabeledGroup;

        return (<ThemeProvider theme={themeStore.themeObject}>
            <I18n i18n={i18n} namespace='game_client'>{
                (t)=> {
                    // status line indicating jobs.
                    const warning =
                        max && max < playersNumber ?
                        (<p><PlayerNumberError t={t} maxNumber={max} /></p>) :
                        minReq > playersNumber ? 
                        (<p><PlayerNumberError t={t} minNumber={minReq} /></p>) :
                        null;
                    return (<div>
                        <StatusLine>
                            {t('gamestart.info.playerNumber', {count: playersNumber})}
                            {' - '}
                            {store.currentCasting.name}
                            {' / '}
                            <JobsString
                                t={t}
                                i18n={i18n}
                                jobNumbers={jobNumbers}
                                categoryNumbers={categoryNumbers}
                                roles={roles}
                                categories={categories}
                            />
                            {warning}
                        </StatusLine>
                        <fieldset>
                            <legend>{t('gamestart.control.roles')}</legend>

                            <SLG
                                items={castings}
                                value={currentCasting.id}
                                getGroupLabel={(x: string)=>({
                                    key: x,
                                    label: x,
                                })}
                                getOptionKey={({id}: CastingDefinition)=>id}
                                makeOption={(obj: CastingDefinition)=>{
                                    return (<option
                                        value={obj.id}
                                        title={obj.label}>
                                            {obj.name}
                                        </option>);
                                    }}
                                    onChange={this.handleCastingChange}
                                />
                                {
                                    currentCasting.roleSelect ?
                                    <SelectRoles
                                        categories={categories}
                                        t={t}
                                        jobNumbers={jobNumbers}
                                        jobInclusions={jobInclusions}
                                        categoryNumbers={categoryNumbers}
                                        roleExclusion={currentCasting.roleExclusion || false}
                                        noFill={currentCasting.noFill || false}
                                        useCategory={currentCasting.category || false}
                                        onUpdate={this.handleJobUpdate}
                                        onCategoryUpdate={this.handleCategoryUpdate}
                                    /> :
                                    null
                                }
                            </fieldset>
                            <fieldset>
                                <legend>{t('gamestart.control.rules')}</legend>
                                <RuleControl
                                    t={t}
                                    ruledefs={ruledefs}
                                    ruleObject={ruleObject}
                                    suggestedOptions={currentCasting.suggestedOptions}
                                    onUpdate={this.handleRuleUpdate}
                                />
                            </fieldset>
                            <div>
                                <WideButton
                                    onClick={this.handleGameStart}
                                >
                                    {t('gamestart.control.start')}
                        </WideButton>
                    </div>
                </div>);
                }
            }</I18n>
        </ThemeProvider>);
        }
    public componentDidCatch(err: any) {
        console.error(err);
    }
    @bind
    protected handleCastingChange(value: CastingDefinition): void {
        this.props.store.setCurrentCasting(value);
    }
    @bind
    protected handleJobUpdate(role: string, value: number, included: boolean): void {
        this.props.store.updateJobNumber(role, value, included);
    }
    @bind
    protected handleCategoryUpdate(cat: string, value: number): void {
        this.props.store.updateCategoryNumber(cat, value);
    }
    @bind
    protected handleRuleUpdate(rule: string, value: string): void {
        this.props.store.updateRule(rule, value);
    }
    @bind
    protected async handleGameStart(): Promise<void> {
        const {
            i18n,
            roles,
            categories,
            ruledefs,
            store,
            onStart,
        } = this.props;
        const query = await gameStart({
            i18n: this.props.i18n,
            roles,
            categories,
            ruledefs,
            store,
        });

        if (query != null) {
            onStart(query);
        }
    }
}
